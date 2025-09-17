// src/components/LessonGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getUserProfile, getContentAccess, hasLessonProgress } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { loadLessonsForUser, applyManualFilters } from '@/lib/lessonFiltering';

interface Lesson {
  id: string;
  title: string;
  level: string;
  content_type: string;
  language_support: string;
  week_number: number;
  image_filename: string;
  created_at: string;
  estimated_duration: number;
  topic_category: string;
  is_published: boolean;
  is_sample: boolean;
}

interface LessonGridProps {
  admin?: boolean;
}

export default function LessonGrid({ admin = false }: LessonGridProps) {
  // Helper function for content type display
  const getContentTypeDisplay = (contentType: string) => {
    return {
      'esl': 'News Articles',
      'clil': 'Science Articles'
    }[contentType] || contentType;
  };
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [contentAccess, setContentAccess] = useState<any>(null);
  const [progressionData, setProgressionData] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    contentType: 'all',
    level: 'all', 
    language: 'all'
  });
  const [showSamples, setShowSamples] = useState(false);
  const [lessonProgressMap, setLessonProgressMap] = useState<{[key: string]: boolean}>({});
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user && contentAccess) {
      fetchLessons();
    }
  }, [filter, user, contentAccess, progressionData]);

  const loadUserData = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      if (!currentUser && !admin) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      if (currentUser) {
        const { profile } = await getUserProfile(currentUser.id);
        setProfile(profile);

        const access = await getContentAccess(currentUser.id);
        setContentAccess(access);

        // Load user progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', currentUser.id);
        setUserProgress(progress || []);

        // Load lesson progress (for resume functionality)
        

        // Calculate progression data (same as dashboard)
        const progression = await calculateProgressionData(currentUser.id, profile);
        setProgressionData(progression);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const calculateProgressionData = async (userId: string, userProfile: any) => {
    try {
      const { data: completedLessons } = await supabase
        .from('user_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .eq('is_completed', true);

      const totalCompleted = completedLessons?.length || 0;
      const joinDate = new Date(userProfile?.created_at || new Date());
      const currentDate = new Date();
      const weeksSinceJoin = Math.floor((currentDate.getTime() - joinDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

      const { data: latestLesson } = await supabase
        .from('lessons')
        .select('week_number')
        .eq('is_published', true)
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

      const currentWeek = latestLesson?.week_number || 1;
      const starterPack = 5;
      let availableLessons = starterPack;
      const weeksBehind = currentWeek - weeksSinceJoin;
      const unlockRate = weeksBehind > 4 ? 2 : 1;
      const additionalWeeks = Math.max(0, weeksSinceJoin - 1);
      availableLessons += additionalWeeks * unlockRate;
      availableLessons = Math.min(availableLessons, currentWeek);

      const lessonsNeededForUnlock = Math.max(0, availableLessons - 3 - totalCompleted);
      const canUnlockMore = lessonsNeededForUnlock === 0;

      return {
        total_completed: totalCompleted,
        available_lessons: canUnlockMore ? availableLessons : totalCompleted + 3,
        unlock_rate: unlockRate,
        weeks_since_join: weeksSinceJoin,
        current_week: currentWeek,
        lessons_needed_for_unlock: lessonsNeededForUnlock,
        is_caught_up: availableLessons >= currentWeek - 2
      };
    } catch (error) {
      console.error('Error calculating progression:', error);
      return {
        total_completed: 0,
        available_lessons: 5,
        unlock_rate: 1,
        weeks_since_join: 1,
        current_week: 1,
        lessons_needed_for_unlock: 0,
        is_caught_up: false
      };
    }
  };

  const fetchLessons = async () => {
  try {
    setLoading(true);
    
    // Wait for all dependencies before loading
    if (!profile || !contentAccess || !progressionData) {
      setLessons([]);
      return;
    }
    
    // Load pre-filtered lessons from database
    const lessons = await loadLessonsForUser(
      profile,
      contentAccess,
      progressionData,
      admin
    );
    
    // Apply manual filters (if any) for admin or free users
    let finalLessons = lessons;
    if (admin || profile.subscription_tier === 'free') {
      finalLessons = applyManualFilters(lessons, filter);
    }
    
    console.log(`🎯 LessonGrid loaded ${finalLessons.length} lessons (${lessons.length} before manual filters)`);
    setLessons(finalLessons);
    
  } catch (error) {
    console.error('Fetch lessons error:', error);
    setLessons([]);
  } finally {
    setLoading(false);
  }
};

  const getLessonStatus = (lesson: Lesson, index: number) => {
    if (admin) return { status: 'available', locked: false };
    
    if (!progressionData) return { status: 'locked', locked: true };

    const lessonProgress = userProgress.find(p => p.lesson_id === lesson.id);
    const isCompleted = lessonProgress?.is_completed || false;
    
    // Samples (999) are always available
    if (lesson.week_number === 999) {
      return { 
        status: isCompleted ? 'completed' : 'available', 
        locked: false 
      };
    }

    // Regular lessons follow progression rules
    const regularLessonsBeforeThis = lessons.filter((l, i) => 
      i < index && l.week_number !== 999
    ).length;
    const isAvailable = regularLessonsBeforeThis < progressionData.available_lessons;
    
    if (isCompleted) {
      return { status: 'completed', locked: false };
    } else if (isAvailable) {
      return { status: 'available', locked: false };
    } else {
      return { status: 'locked', locked: true };
    }
  };

  const getSubscriptionInfo = () => {
    if (admin) return { label: 'Admin View', color: 'bg-red-100 text-red-800' };
    if (!contentAccess) return { label: 'Loading...', color: 'bg-gray-100 text-gray-800' };

    if (contentAccess.canAccessESL && contentAccess.canAccessCLIL) {
      const languageDisplay = profile?.language_support || 'English';
      return { label: `Complete (${languageDisplay})`, color: 'bg-green-100 text-green-800' };
    } else if (contentAccess.canAccessESL) {
  return { label: 'News Articles', color: 'bg-orange-100 text-orange-800' };
} else if (contentAccess.canAccessCLIL) {
  const clilLanguage = profile?.language_support || 'English';
  return { 
    label: clilLanguage === 'English' ? 'Science Articles' : `Science Articles (${clilLanguage})`, 
    color: 'bg-purple-100 text-purple-800' 
  };
    } else {
      return { label: 'Free Plan', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getAvailableFilterOptions = () => {
    if (admin) {
      return {
        contentTypes: ['all', 'esl', 'clil'],
        levels: ['all', 'beginner', 'intermediate'],
        languages: ['all', 'english', 'czech', 'german', 'french', 'spanish', 'polish']
      };
    }

    if (!contentAccess) {
      return { contentTypes: ['all'], levels: ['all'], languages: ['all'] };
    }

    const options = {
      contentTypes: ['all'],
      levels: ['all', 'beginner', 'intermediate'],
      languages: ['all']
    };

    // Content type options based on subscription
    if (contentAccess.canAccessESL && contentAccess.canAccessCLIL) {
      options.contentTypes = ['all', 'esl', 'clil'];
      options.languages = ['all', 'english', 'czech', 'german', 'french', 'spanish', 'polish'];
    } else if (contentAccess.canAccessESL) {
      options.contentTypes = ['all', 'esl'];
      options.languages = ['all', 'english'];
    } else if (contentAccess.canAccessCLIL) {
      options.contentTypes = ['all', 'clil'];
      options.languages = ['all', 'czech', 'german', 'french', 'spanish', 'polish'];
    } else {
      // Free users see all sample content
      options.contentTypes = ['all', 'esl', 'clil'];
      options.languages = ['all', 'english', 'czech', 'german', 'french', 'spanish', 'polish'];
    }

    return options;
  };

  const handleLessonClick = (lesson: Lesson, status: any) => {
    if (admin) {
      router.push(`/lessons/${lesson.id}`);
    } else if (!status.locked) {
      router.push(`/lessons/${lesson.id}`);
    }
  };

  // Extended loading condition to prevent flash
const isFullyLoaded = user && profile && contentAccess && progressionData;

if (loading || !isFullyLoaded) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading lessons...</p>
      </div>
    </div>
  );
}

  const subscriptionInfo = getSubscriptionInfo();
  const filterOptions = getAvailableFilterOptions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Back to Dashboard Button for Students */}
          {!admin && (
            <div className="mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {admin ? 'All Lessons (Admin)' : 'Your Lessons'}
              </h1>
              <p className="text-gray-600 mt-1">
                {admin ? 'Complete lesson library' : 'Interactive English learning content'}
              </p>
              {!admin && progressionData && (
                <p className="text-sm text-blue-600 mt-2">
                  {progressionData.lessons_needed_for_unlock > 0 
                    ? `Complete ${progressionData.lessons_needed_for_unlock} more to unlock new content`
                    : 'All current content unlocked!'
                  }
                </p>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${subscriptionInfo.color}`}>
              {subscriptionInfo.label}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Filters - Only for Free Users */}
        {profile?.subscription_tier === 'free' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Explore Sample Lessons</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <select
                  value={filter.contentType}
                  onChange={(e) => setFilter({...filter, contentType: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {filterOptions.contentTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : 
                       type === 'esl' ? 'News Articles' : 
                       'Science Articles'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={filter.level}
                  onChange={(e) => setFilter({...filter, level: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {filterOptions.levels.map(level => (
                    <option key={level} value={level}>
                      {level === 'all' ? 'All Levels' : 
                       level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language Support</label>
                <select
                  value={filter.language}
                  onChange={(e) => setFilter({...filter, language: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {filterOptions.languages.map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'all' ? 'All Languages' :
                       lang === 'english' ? 'English Only' :
                       lang.charAt(0).toUpperCase() + lang.slice(1) + ' Support'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Lessons Grid */}
        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No lessons found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new content.
            </p>
          </div>
        ) : (
          <>
            {/* Split lessons into regular and samples */}
            {(() => {
              const regularLessons = lessons.filter(l => l.week_number !== 999);
              const sampleLessons = lessons.filter(l => l.week_number === 999);
              
              return (
                <>
                  {/* Regular Lessons */}
                  {regularLessons.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Learning Path</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularLessons
                          .map((lesson, originalIndex) => ({ 
                            lesson, 
                            status: getLessonStatus(lesson, originalIndex),
                            originalIndex 
                          }))
                          .sort((a, b) => {
                            // Priority sorting: available > completed > locked
                            const statusOrder: { [key: string]: number } = { 'available': 0, 'completed': 1, 'locked': 2 };
                            const aOrder = statusOrder[a.status.status] ?? 3;
                            const bOrder = statusOrder[b.status.status] ?? 3;
                            
                            if (aOrder !== bOrder) {
                              return aOrder - bOrder;
                            }
                            // Within same status, sort by week number
                            if (a.status.status === 'available') {
                              return a.lesson.week_number - b.lesson.week_number; // Available: oldest first (chronological)
                            } else if (a.status.status === 'completed') {
                              return b.lesson.week_number - a.lesson.week_number; // Completed: newest first (recent completions)
                            } else {
                              return a.lesson.week_number - b.lesson.week_number; // Locked: oldest first (next unlock progression)
                            }
                          })
                          .map(({ lesson, status }, displayIndex) => {
                          
                          return (
                            <div
                              key={lesson.id}
                              className={`bg-white rounded-lg shadow-sm transition-all overflow-hidden ${
                                status.locked 
                                  ? 'opacity-60 cursor-not-allowed' 
                                  : 'hover:shadow-lg cursor-pointer'
                              }`}
                              onClick={() => handleLessonClick(lesson, status)}
                            >
                              <div className="h-48 bg-gray-200 relative overflow-hidden">
                                <img
                                  src={`/images/lessons/${lesson.image_filename}.jpg`}
                                  alt={lesson.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/lessons/placeholder.jpg';
                                  }}
                                />
                                
                                <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 text-sm font-semibold text-gray-900 shadow-lg">
                                  Week {lesson.week_number}
                                </div>

                                <div className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-medium shadow-lg ${
                                  lesson.content_type === 'esl' 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-purple-500 text-white'
                                }`}>
                                  {getContentTypeDisplay(lesson.content_type)}
                                </div>

                                {status.locked && (
                                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                    <div className="text-center text-white">
                                      <div className="text-3xl mb-2">🔒</div>
                                      <p className="text-sm font-medium">
                                        {progressionData?.lessons_needed_for_unlock > 0 
                                          ? `Complete ${progressionData.lessons_needed_for_unlock} more lessons`
                                          : 'Coming soon'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {status.status === 'completed' && (
                                  <div className="absolute bottom-4 right-4 bg-green-500 text-white rounded-full p-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {lesson.title}
                                </h3>
                                
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                  <span className="capitalize">{lesson.level}</span>
                                  <span className="capitalize">
                                    {lesson.language_support === 'en' ? 'English' : 
                                     lesson.language_support === 'cs' ? 'Czech' :
                                     lesson.language_support === 'de' ? 'German' :
                                     lesson.language_support === 'fr' ? 'French' :
                                     lesson.language_support === 'es' ? 'Spanish' :
                                     lesson.language_support === 'pl' ? 'Polish' :
                                     lesson.language_support}
                                  </span>
                                </div>

                                <button 
                                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                    status.locked
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : status.status === 'completed'
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                  disabled={status.locked}
                                >
                                  {status.locked 
                                    ? 'Locked' 
                                    : status.status === 'completed' 
                                    ? 'Review Lesson' 
                                    : 'Start/Resume Lesson'
                                  }
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Sample Lessons - Collapsible */}
                  {sampleLessons.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Sample Lessons</h2>
                        <button
                          onClick={() => setShowSamples(!showSamples)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <span>{showSamples ? 'Hide' : 'Show'} Samples</span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${showSamples ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {showSamples && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sampleLessons.map((lesson, index) => {
                            const status = getLessonStatus(lesson, index);
                            
                            return (
                              <div
                                key={lesson.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-lg cursor-pointer transition-all overflow-hidden"
                                onClick={() => handleLessonClick(lesson, status)}
                              >
                                <div className="h-48 bg-gray-200 relative overflow-hidden">
                                  <img
                                    src={`/images/lessons/${lesson.image_filename}.jpg`}
                                    alt={lesson.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/lessons/placeholder.jpg';
                                    }}
                                  />
                                  
                                  <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 text-sm font-semibold text-gray-900 shadow-lg">
                                    Sample
                                  </div>

                                  <div className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-medium shadow-lg ${
                                    lesson.content_type === 'esl' 
                                      ? 'bg-orange-500 text-white' 
                                      : 'bg-purple-500 text-white'
                                  }`}>
                                    {getContentTypeDisplay(lesson.content_type)}
                                  </div>

                                  {status.status === 'completed' && (
                                    <div className="absolute bottom-4 right-4 bg-green-500 text-white rounded-full p-2">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>

                                <div className="p-6">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {lesson.title}
                                  </h3>
                                  
                                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                    <span className="capitalize">{lesson.level}</span>
                                    <span className="capitalize">
                                      {lesson.language_support === 'en' ? 'English' : 
                                       lesson.language_support === 'cs' ? 'Czech' :
                                       lesson.language_support === 'de' ? 'German' :
                                       lesson.language_support === 'fr' ? 'French' :
                                       lesson.language_support === 'es' ? 'Spanish' :
                                       lesson.language_support === 'pl' ? 'Polish' :
                                       lesson.language_support}
                                    </span>
                                  </div>

                                  <button 
                                    className="w-full py-2 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                  >
                                    {status.status === 'completed' ? 'Review Sample' : 'Try Sample'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}