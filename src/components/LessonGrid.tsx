// src/components/LessonGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getUserProfile, getContentAccess } from '@/lib/auth';
import { useRouter } from 'next/navigation';

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
      
      let query = supabase
        .from('lessons')
        .select('*')
        .eq(admin ? 'published' : 'is_published', true)
        .order('week_number', { ascending: true });

      // Apply manual filters
      if (filter.contentType !== 'all') {
        query = query.eq('content_type', filter.contentType);
      }
      if (filter.level !== 'all') {
        query = query.eq('level', filter.level);
      }
      if (filter.language !== 'all') {
        const capitalizedLanguage = filter.language.charAt(0).toUpperCase() + filter.language.slice(1);
        query = query.eq('language_support', capitalizedLanguage);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching lessons:', error);
        setLessons([]);
        return;
      }

      let filteredLessons = data || [];

      if (!admin && contentAccess && progressionData) {
        // Apply subscription filtering
        if (contentAccess.canAccessESL && contentAccess.canAccessCLIL) {
          // Complete plan - show all
        } else if (contentAccess.canAccessESL) {
          filteredLessons = filteredLessons.filter(l => l.content_type === 'esl');
        } else if (contentAccess.canAccessCLIL) {
          filteredLessons = filteredLessons.filter(l => l.content_type === 'clil');
        } else {
          // Free user - only samples
          filteredLessons = filteredLessons.filter(l => l.is_sample);
        }

        // Apply level preference
        if (profile?.preferred_level) {
          filteredLessons = filteredLessons.filter(l => l.level === profile.preferred_level);
        }

        // Apply progression filtering: available lessons + next 8 locked
        const maxLessonsToShow = progressionData.available_lessons + 8;
        filteredLessons = filteredLessons.slice(0, maxLessonsToShow);
      }

      setLessons(filteredLessons);
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
    const isAvailable = index < progressionData.available_lessons;
    
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
      return { label: 'Complete Plan', color: 'bg-green-100 text-green-800' };
    } else if (contentAccess.canAccessESL) {
      return { label: 'ESL Only', color: 'bg-orange-100 text-orange-800' };
    } else if (contentAccess.canAccessCLIL) {
      return { label: 'CLIL English', color: 'bg-purple-100 text-purple-800' };
    } else {
      return { label: 'Free Plan', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleLessonClick = (lesson: Lesson, status: any) => {
    if (admin) {
      // Admin can preview any lesson
      router.push(`/lessons/${lesson.id}`);
    } else if (!status.locked) {
      // Student can only access available/completed lessons
      router.push(`/lessons/${lesson.id}`);
    }
    // Locked lessons do nothing on click
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
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
                  {progressionData.available_lessons} available • {progressionData.lessons_needed_for_unlock > 0 
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
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Lessons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={filter.contentType}
                onChange={(e) => setFilter({...filter, contentType: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="esl">ESL (News)</option>
                <option value="clil">CLIL (Science)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={filter.level}
                onChange={(e) => setFilter({...filter, level: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language Support</label>
              <select
                value={filter.language}
                onChange={(e) => setFilter({...filter, language: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Languages</option>
                <option value="english">English Only</option>
                <option value="czech">Czech Support</option>
                <option value="german">German Support</option>
                <option value="french">French Support</option>
                <option value="spanish">Spanish Support</option>
                <option value="polish">Polish Support</option>
              </select>
            </div>
          </div>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson, index) => {
              const status = getLessonStatus(lesson, index);
              
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
                  {/* Lesson Image */}
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <img
                      src={`/images/lessons/${lesson.image_filename}.jpg`}
                      alt={lesson.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/lessons/placeholder.jpg';
                      }}
                    />
                    
                    {/* Week Badge */}
                    <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 text-sm font-semibold text-gray-900 shadow-lg">
                      Week {lesson.week_number}
                    </div>

                    {/* Content Type Badge */}
                    <div className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-medium shadow-lg ${
                      lesson.content_type === 'esl' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-purple-500 text-white'
                    }`}>
                      {lesson.content_type.toUpperCase()}
                    </div>

                    {/* Status Overlay */}
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

                  {/* Lesson Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {lesson.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span className="capitalize">{lesson.level}</span>
                      <span className="capitalize">{lesson.language_support}</span>
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
                        : 'Start Lesson'
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}