'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile, signOut, getContentAccess, isSessionValid, changeUserLevel, type UserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  BookOpen, 
  Award, 
  Target, 
  TrendingUp, 
  Clock, 
  Star,
  Play,
  ChevronRight,
  Calendar,
  Trophy,
  Flame,
  BarChart3,
  Lock,
  Unlock,
  Timer,
  CheckCircle,
  Settings,
  CreditCard,
  Bell
} from 'lucide-react';
import { loadLessonsForUser } from '../../lib/lessonFiltering';


export type Lesson = {
  id: string;
  title: string;
  description: string;
  content_type: 'esl' | 'clil';
  level: 'beginner' | 'intermediate';
  language_support: string;
  topic_category: string;
  estimated_duration: number;
  is_sample: boolean;
  week_number: number;
  image_filename: string;
  slug: string;
  tags: string[];
  vocabulary_data: any;
  created_at: string;        // ADD THIS
  is_published: boolean;     // ADD THIS
};

type UserProgress = {
  lesson_id: string;
  is_completed: boolean;
  percentage_score: number;
  completed_at: string | null;
  time_spent: number;
};

type ProgressionData = {
  total_completed: number;
  available_lessons: number;
  unlock_rate: number;
  weeks_since_join: number;
  current_week: number;
  days_until_next_unlock: number;
  lessons_needed_for_unlock: number;
  is_caught_up: boolean;
};

type VocabularyData = {
  vocabularyWords: Array<{
    word: string;
    definition: string;
    lessonTitle: string;
    contentType: string;
    completedAt: string;
  }>;
  reviewAvailable: boolean;
  sourceLessons: number;
};

type StreakData = {
  currentStreak: number;
  thisWeekCompleted: number;
  weeklyCompletionRate: number;
  weeksSinceJoin: number;
};

// VOCABULARY REVIEW MODAL COMPONENT
interface VocabularyReviewModalProps {
  vocabularyWords: Array<{
    word: string;
    definition: string;
    lessonTitle: string;
    contentType: string;
    completedAt: string;
  }>;
  onClose: () => void;
  onComplete: (score: number) => void;
}

const VocabularyReviewModal: React.FC<VocabularyReviewModalProps> = ({ vocabularyWords, onClose, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [results, setResults] = useState<Array<{
    word: string;
    correct: boolean;
    selectedAnswer: string;
    correctAnswer: string;
    lessonTitle: string;
  }>>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const currentWord = vocabularyWords[currentIndex];

  useEffect(() => {
    if (currentWord) {
      const correctDefinition = currentWord.definition;
      const wrongDefinitions = vocabularyWords
        .filter(w => w.word !== currentWord.word)
        .map(w => w.definition)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const allOptions = [correctDefinition, ...wrongDefinitions];
      setShuffledOptions(allOptions.sort(() => 0.5 - Math.random()));
    }
  }, [currentIndex, currentWord, vocabularyWords]);

  const handleAnswerSelect = (definition: string) => {
    setSelectedAnswer(definition);
    setShowResult(true);

    const isCorrect = definition === currentWord.definition;
    const newResult = {
      word: currentWord.word,
      correct: isCorrect,
      selectedAnswer: definition,
      correctAnswer: currentWord.definition,
      lessonTitle: currentWord.lessonTitle
    };

    setResults(prev => [...prev, newResult]);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < vocabularyWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        onComplete(Math.round((score + (isCorrect ? 1 : 0)) / vocabularyWords.length * 100));
      }
    }, 2000);
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage: number): string => {
    if (percentage >= 80) return 'Excellent! 🎉';
    if (percentage >= 60) return 'Good work! 👍';
    return 'Keep practicing! 📚';
  };

  if (!currentWord) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Vocabulary Review</h2>
              <p className="text-gray-600">Question {currentIndex + 1} of {vocabularyWords.length}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / vocabularyWords.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{currentWord.word}</h3>
            <p className="text-gray-600">From: {currentWord.lessonTitle}</p>
            <p className="text-lg text-gray-800 mt-4 font-medium">Choose the correct definition:</p>
          </div>

          <div className="space-y-3">
            {shuffledOptions.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentWord.definition;
              
              let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all ";
              
              if (!showResult) {
                buttonClass += "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
              } else {
                if (isSelected && isCorrect) {
                  buttonClass += "border-green-500 bg-green-50 text-green-800";
                } else if (isSelected && !isCorrect) {
                  buttonClass += "border-red-500 bg-red-50 text-red-800";
                } else if (isCorrect) {
                  buttonClass += "border-green-500 bg-green-50 text-green-800";
                } else {
                  buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => !showResult && handleAnswerSelect(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isSelected && (
                      <span className="ml-2">{isCorrect ? '✓' : '✗'}</span>
                    )}
                    {showResult && !isSelected && isCorrect && (
                      <span className="ml-2 text-green-600">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-6 text-center">
              <div className={`text-xl font-bold ${selectedAnswer === currentWord.definition ? 'text-green-600' : 'text-red-600'}`}>
                {selectedAnswer === currentWord.definition ? 'Correct! 🎉' : 'Not quite! 📚'}
              </div>
              {selectedAnswer !== currentWord.definition && (
                <p className="text-gray-600 mt-2">
                  The correct answer is: <strong>{currentWord.definition}</strong>
                </p>
              )}
              <div className="mt-4">
                <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                  <span>Score: {score}/{currentIndex + 1}</span>
                  <span>•</span>
                  <span>{Math.round((score / (currentIndex + 1)) * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {currentIndex === vocabularyWords.length - 1 && showResult && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Review Complete!</h3>
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(Math.round((score / vocabularyWords.length) * 100))}`}>
                  {Math.round((score / vocabularyWords.length) * 100)}%
                </div>
                <p className={`text-xl mb-4 ${getScoreColor(Math.round((score / vocabularyWords.length) * 100))}`}>
                  {getScoreMessage(Math.round((score / vocabularyWords.length) * 100))}
                </p>
                <p className="text-gray-600">You got {score} out of {vocabularyWords.length} words correct</p>
                
                <div className="mt-6 text-left">
                  <h4 className="font-bold text-gray-900 mb-3">Review Summary:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.map((result, index) => (
                      <div key={index} className={`p-2 rounded text-sm ${result.correct ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.word}</span>
                          <span>{result.correct ? '✓' : '✗'}</span>
                        </div>
                        {!result.correct && (
                          <div className="text-xs text-gray-600 mt-1">
                            Correct: {result.correctAnswer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [contentAccess, setContentAccess] = useState<any>(null);
  const [progressionData, setProgressionData] = useState<ProgressionData | null>(null);
  const [vocabularyData, setVocabularyData] = useState<VocabularyData>({ vocabularyWords: [], reviewAvailable: false, sourceLessons: 0 });
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showVocabReview, setShowVocabReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // LEARNING STREAK CALCULATOR
  const calculateLearningStreak = (progressData: UserProgress[], userProfile: UserProfile | null): StreakData => {
    if (!progressData.length || !userProfile) {
      return { currentStreak: 0, thisWeekCompleted: 0, weeklyCompletionRate: 0, weeksSinceJoin: 1 };
    }

    const joinDate = new Date(userProfile.created_at);
    const currentDate = new Date();
    const weeksSinceJoin = Math.floor((currentDate.getTime() - joinDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    
    // Group completions by week
    const completionsByWeek: { [key: number]: number } = {};
    progressData.filter(p => p.is_completed && p.completed_at).forEach(completion => {
      const completionDate = new Date(completion.completed_at!);
      const weekNumber = Math.floor((completionDate.getTime() - joinDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      
      if (!completionsByWeek[weekNumber]) {
        completionsByWeek[weekNumber] = 0;
      }
      completionsByWeek[weekNumber]++;
    });

    // Calculate current streak
    let currentStreak = 0;
    for (let week = weeksSinceJoin; week >= 1; week--) {
      if (completionsByWeek[week] && completionsByWeek[week] > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    const thisWeekCompleted = completionsByWeek[weeksSinceJoin] || 0;
    const totalWeeksWithContent = Math.max(1, weeksSinceJoin);
    const weeklyCompletionRate = Math.round((progressData.filter(p => p.is_completed).length / totalWeeksWithContent) * 10) / 10;

    return {
      currentStreak,
      thisWeekCompleted,
      weeklyCompletionRate,
      weeksSinceJoin
    };
  };

  // VOCABULARY REVIEW SYSTEM
  const getVocabularyForReview = async (userId: string, access: any): Promise<VocabularyData> => {
    try {
      const { data: recentProgress, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          lesson_id,
          completed_at,
          lessons!inner (
            id,
            title,
            content_type,
            vocabulary_data,
            level
          )
        `)
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(4);

      if (progressError) throw progressError;

      if (!recentProgress || recentProgress.length === 0) {
        return { vocabularyWords: [], reviewAvailable: false, sourceLessons: 0 };
      }

      // Filter lessons based on user's content access
      const accessibleLessons = recentProgress.filter((progress: any) => {
        const lesson = progress.lessons;
        if (!lesson) return false;
        
        if (access.canAccessESL && access.canAccessCLIL) {
          return true;
        } else if (access.canAccessESL) {
          return lesson.content_type === 'esl';
        } else if (access.canAccessCLIL) {
          return lesson.content_type === 'clil';
        }
        return false;
      });

      // Extract vocabulary from accessible lessons
      let allVocabulary: Array<{
        word: string;
        definition: string;
        lessonTitle: string;
        contentType: string;
        completedAt: string;
      }> = [];
      
      accessibleLessons.forEach((progress: any) => {
        const lesson = progress.lessons;
        if (lesson && lesson.vocabulary_data) {
          try {
            const vocabData = typeof lesson.vocabulary_data === 'string' 
              ? JSON.parse(lesson.vocabulary_data) 
              : lesson.vocabulary_data;
            
            if (Array.isArray(vocabData)) {
              vocabData.forEach((item: any) => {
                allVocabulary.push({
                  word: item.word,
                  definition: item.definition,
                  lessonTitle: lesson.title,
                  contentType: lesson.content_type,
                  completedAt: progress.completed_at
                });
              });
            }
          } catch (parseError) {
            console.error('Error parsing vocabulary data:', parseError);
          }
        }
      });

      const shuffled = allVocabulary.sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, Math.min(6, shuffled.length));

      return {
        vocabularyWords: selectedWords,
        reviewAvailable: selectedWords.length > 0,
        sourceLessons: accessibleLessons.length
      };

    } catch (error) {
      console.error('Error getting vocabulary for review:', error);
      return { vocabularyWords: [], reviewAvailable: false, sourceLessons: 0 };
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    const sessionCheck = setInterval(async () => {
      const isValid = await isSessionValid();
      if (!isValid) {
        console.log('Session expired, redirecting to login...');
        router.push('/login');
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(sessionCheck);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const { user: currentUser, error: userError } = await getCurrentUser();
      
      if (userError || !currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      const { profile: userProfile, error: profileError } = await getUserProfile(currentUser.id);
      
      if (profileError || !userProfile) {
        console.log('Profile not found, creating new profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: currentUser.id,
            email: currentUser.email!,
            email_verified: currentUser.email_confirmed_at ? true : false,
            onboarding_completed: false
          })
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          setProfile({
            id: currentUser.id,
            email: currentUser.email!,
            preferred_content_type: null,
            preferred_level: null,
            language_support: 'en',
            subscription_tier: 'free',
            subscription_status: 'inactive',
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            last_level_change: new Date().toISOString(),
            level_change_count: 0
          });
        } else {
          setProfile(newProfile);
        }
      } else {
        setProfile(userProfile);
}

const access = await getContentAccess(currentUser.id);
setContentAccess(access);

await loadProgress(currentUser.id);
const progression = await calculateProgressionData(currentUser.id, userProfile);
setProgressionData(progression);

// Load enhanced features first
await loadEnhancedData(currentUser.id, access, userProfile);

// Call loadLessonsWithProgression AFTER everything else is set up
await loadLessonsWithProgression(currentUser.id, access, progression, userProfile);

    } catch (err: any) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadEnhancedData = async (userId: string, access: any, userProfile: UserProfile | null) => {
    // Calculate learning streak
    const streak = calculateLearningStreak(progress, userProfile);
    setStreakData(streak);

    // Load vocabulary for review
    const vocabData = await getVocabularyForReview(userId, access);
    setVocabularyData(vocabData);
  };

  const calculateProgressionData = async (userId: string, userProfile: UserProfile | null): Promise<ProgressionData> => {
    try {
      const { data: completedLessons, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .eq('is_completed', true);

      if (progressError) throw progressError;

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

      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay() + 1) % 7);
      const daysUntilNextUnlock = Math.ceil((nextMonday.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));

      const isCaughtUp = availableLessons >= currentWeek - 2;

      return {
        total_completed: totalCompleted,
        available_lessons: canUnlockMore ? availableLessons : totalCompleted + 3,
        unlock_rate: unlockRate,
        weeks_since_join: weeksSinceJoin,
        current_week: currentWeek,
        days_until_next_unlock: daysUntilNextUnlock,
        lessons_needed_for_unlock: lessonsNeededForUnlock,
        is_caught_up: isCaughtUp
      };

    } catch (error) {
      console.error('Error calculating progression:', error);
      return {
        total_completed: 0,
        available_lessons: 5,
        unlock_rate: 1,
        weeks_since_join: 1,
        current_week: 1,
        days_until_next_unlock: 7,
        lessons_needed_for_unlock: 0,
        is_caught_up: false
      };
    }
  };

const loadLessonsWithProgression = async (userId: string, access: any, progression: ProgressionData, userProfile: UserProfile | null) => {
  if (!userProfile || !access || !progression) {
    console.log('⏳ Dependencies not ready, skipping lesson loading');
    return;
  }
  
  try {
    console.log('🔍 Dashboard loading lessons:', {
      profile: userProfile?.preferred_level,
      access: access,
      progression: progression?.available_lessons
    });
    
    // Load pre-filtered lessons directly from database
    const lessons = await loadLessonsForUser(
      userProfile,
      access,
      progression,
      false
    );
    
    console.log('🔍 Dashboard loaded lessons:', lessons.length);
    setLessons(lessons);
  } catch (err: any) {
    console.error('Lessons loading error:', err);
    setLessons([]);
  }
};
    
    const loadProgress = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setProgress(data || []);
    } catch (err: any) {
      console.error('Progress loading error:', err);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
    } else {
      router.push('/');
    }
  };

  const handleBillingPortal = async () => {
    if (!user?.id) {
      alert('User not found. Please refresh and try again.');
      return;
    }

    try {
      const response = await fetch('/api/create-billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert('Error accessing billing portal: ' + error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) {
      alert('User not found. Please refresh and try again.');
      return;
    }

    const confirmCancel = confirm(
      'Are you sure you want to cancel your subscription? You will lose access to paid content at the end of your current billing period.'
    );
    
    if (!confirmCancel) return;

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const { success, error } = await response.json();

      if (error) {
        alert('Error canceling subscription: ' + error);
        return;
      }

      if (success) {
        alert('Subscription cancelled successfully. You will retain access until the end of your current billing period.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleLevelChange = async (newLevel: 'beginner' | 'intermediate') => {
    if (!user?.id) {
      alert('User not found. Please refresh and try again.');
      return;
    }

    try {
      const { success, error } = await changeUserLevel(user.id, newLevel);
      
      if (error) {
        alert(error);
        return;
      }
      
      if (success) {
        alert(`Successfully changed to ${newLevel} level!`);
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Level change error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const getProgressForLesson = (lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  const getSubscriptionBadge = () => {
  if (!profile) return { text: 'Loading...', color: 'gray' };
  
  switch (profile.subscription_tier) {
    case 'free':
      return { text: 'Free', color: 'gray' };
    case 'esl_only':
      return { text: 'ESL', color: 'orange' };
    case 'clil_plus':
      const clilLanguage = profile?.language_support || 'English';
      // Show just "CLIL" for English, "CLIL (Language)" for others
      return { 
        text: clilLanguage === 'English' ? 'CLIL' : `CLIL (${clilLanguage})`, 
        color: 'purple' 
      };
    case 'complete_plan':
      const languageDisplay = profile?.language_support || 'English';
      return { text: `Complete (${languageDisplay})`, color: 'green' };
    default:
      return { text: 'Free', color: 'gray' };
  }
};

  const getLessonStatus = (lesson: Lesson, index: number) => {
    const lessonProgress = getProgressForLesson(lesson.id);
    const isCompleted = lessonProgress?.is_completed || false;
    const isAvailable = progressionData && index < progressionData.available_lessons;
    const isComingSoon = progressionData && index === progressionData.available_lessons && progressionData.lessons_needed_for_unlock === 0;
    
    if (isCompleted) {
      return { status: 'completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    } else if (isAvailable) {
      return { status: 'available', icon: Unlock, color: 'text-blue-600', bg: 'bg-blue-100' };
    } else if (isComingSoon) {
      return { status: 'coming_soon', icon: Timer, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { status: 'locked', icon: Lock, color: 'text-gray-400', bg: 'bg-gray-100' };
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // CONTINUE LEARNING COMPONENT
const ContinueLearningSection = () => {
  if (!lessons.length || !progressionData) return null;

  // Count available lessons (not completed)
  console.log('🔍 ContinueLearningSection lessons:', {
  totalLessons: lessons.length,
  lessonLevels: lessons.map(l => ({ title: l.title.substring(0, 20), level: l.level, week: l.week_number }))
});
  const availableLessons = lessons.filter((lesson, index) => {
    const isAvailable = lesson.week_number === 999 || index < progressionData.available_lessons;
    const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
    const isCompleted = lessonProgress?.is_completed || false;
    return isAvailable && !isCompleted;
  });

  if (availableLessons.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">All Caught Up! 🎉</h2>
          <p className="text-green-700 mb-4">
            You've completed all available lessons. New content unlocks in {progressionData.days_until_next_unlock} days!
          </p>
          <button
            onClick={() => router.push('/lessons')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Review Completed Lessons
          </button>
        </div>
      </div>
    );
  }

  // Show overview of available content instead of picking one lesson
  const eslLessons = availableLessons.filter(l => l.content_type === 'esl');
  const clilLessons = availableLessons.filter(l => l.content_type === 'clil');
  const samples = availableLessons.filter(l => l.week_number === 999);
  const regular = availableLessons.filter(l => l.week_number !== 999);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <Play className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-1">Continue Learning</h2>
           {(() => {
  // Separate counts: regular lessons (weeks 1-998) vs samples (week 999)
  const regularLessons = availableLessons.filter(l => l.week_number !== 999);
  const samples = availableLessons.filter(l => l.week_number === 999);
  const regularESL = regularLessons.filter(l => l.content_type === 'esl');
  const regularCLIL = regularLessons.filter(l => l.content_type === 'clil');
  
  return (
    <>
      <p className="text-blue-700 font-medium mb-2">
  {regularLessons.length} lesson{regularLessons.length > 1 ? 's' : ''} available
</p>
      
      {/* Show breakdown: ESL first, then CLIL, then Samples last */}
      <div className="flex items-center space-x-4 text-sm">
  {regularESL.length > 0 && (
    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
      {regularESL.length} ESL
    </span>
  )}
  {regularCLIL.length > 0 && (
    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
      {regularCLIL.length} CLIL
    </span>
  )}
</div>
    </>
  );
})()}
            
            {/* Anti-binge protection info */}
            {progressionData.lessons_needed_for_unlock > 0 && (
              <p className="text-xs text-blue-600 mt-2">
                Complete {progressionData.lessons_needed_for_unlock} more to unlock additional content
              </p>
            )}
          </div>
        </div>
        <button
  onClick={() => router.push('/lessons')}
  className="px-4 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm sm:text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center w-full sm:w-auto"
>
  <div className="text-center leading-tight">
    <div className="block sm:hidden">
      <div>Continue</div>
      <div>Learning →</div>
    </div>
    <div className="hidden sm:block">
      Continue Learning →
    </div>
  </div>
</button>
      </div>
    </div>
  );
};

  // VOCABULARY REVIEW SECTION
  const VocabularyReviewSection = () => {
    if (!vocabularyData.reviewAvailable) return null;

    return (
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-900">Vocabulary Review</h3>
              <p className="text-purple-700 text-sm">
                Review {vocabularyData.vocabularyWords.length} words from your recent lessons
              </p>
              <p className="text-purple-600 text-xs mt-1">
                From {vocabularyData.sourceLessons} recent lesson{vocabularyData.sourceLessons > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowVocabReview(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
          >
            Start Review (2 min)
          </button>
        </div>
      </div>
    );
  };

  // Early returns for loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-red-800 font-semibold mb-2">Dashboard Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate data for main dashboard
  const badge = getSubscriptionBadge();
  const averageScore = progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + (p.percentage_score || 0), 0) / progress.length)
    : 0;
  const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  ELL Interactive Platform
                </Link>
                <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
                  badge.color === 'green' ? 'bg-green-50 text-green-800 border-green-200' :
                  badge.color === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  badge.color === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                  badge.color === 'orange' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                  'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {badge.text.toUpperCase()} PLAN
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 hidden md:block">
                  Welcome, {user?.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Container with proper responsive constraints */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Your Learning Journey 🚀
            </h1>
            <p className="text-xl text-gray-600">
              Track your progress and unlock new content as you learn
            </p>
          </div>

{/* Free User Upgrade Banner - Only show for free users */}
{profile?.subscription_tier === 'free' && (
  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">Unlock Your Full Learning Potential</h2>
          <p className="text-blue-100 mb-2">
            You're currently exploring samples. Upgrade to access our complete learning system!
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Weekly new lessons
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Progressive learning path
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Multi-language support
            </span>
          </div>
        </div>
      </div>
      <Link 
        href="/subscribe" 
        className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg whitespace-nowrap ml-4"
      >
        Choose Your Plan →
      </Link>
    </div>
  </div>
)}

          {/* CONTINUE LEARNING - Prominent placement */}
          <ContinueLearningSection />

          {/* VOCABULARY REVIEW - When available */}
          <VocabularyReviewSection />

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Learning Progress Overview */}
              {progressionData && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center space-x-2">
                    <Target className="h-6 w-6" />
                    <span>Learning Progress</span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-800 font-medium">Lessons Completed</span>
                        <span className="text-blue-900 font-bold text-lg">
                          {progressionData.total_completed}/{progressionData.available_lessons}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((progressionData.total_completed / progressionData.available_lessons) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-blue-700 mt-2">
                        {progressionData.available_lessons - progressionData.total_completed} lessons to go
                      </p>
                    </div>

                    <div>
                      {progressionData.lessons_needed_for_unlock > 0 ? (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-blue-800 font-medium">Next Unlock</span>
                            <span className="text-blue-900 font-bold text-lg">
                              {progressionData.lessons_needed_for_unlock} needed
                            </span>
                          </div>
                          <div className="w-full bg-yellow-200 rounded-full h-3">
                            <div 
                              className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.max(100 - (progressionData.lessons_needed_for_unlock / 3) * 100, 0)}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-sm text-blue-700 mt-2">
                            Complete {progressionData.lessons_needed_for_unlock} more lesson{progressionData.lessons_needed_for_unlock > 1 ? 's' : ''} to unlock new content
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-blue-800 font-medium">Next Unlock</span>
                            <span className="text-blue-900 font-bold text-lg">
                              {progressionData.days_until_next_unlock}d
                            </span>
                          </div>
                          <div className="w-full bg-green-200 rounded-full h-3">
                            <div className="bg-green-500 h-3 rounded-full w-full"></div>
                          </div>
                          <p className="text-sm text-blue-700 mt-2">
                            {progressionData.unlock_rate} new lesson{progressionData.unlock_rate > 1 ? 's' : ''} unlock in {progressionData.days_until_next_unlock} day{progressionData.days_until_next_unlock > 1 ? 's' : ''}!
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progression Status */}
                  <div className="mt-6 p-4 bg-white rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {progressionData.is_caught_up ? (
                            <span className="text-green-600">✨ You're caught up!</span>
                          ) : (
                            <span className="text-blue-600">⚡ Catch-up mode active</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {progressionData.is_caught_up 
                            ? `Unlocking ${progressionData.unlock_rate} lesson per week`
                            : `Unlocking ${progressionData.unlock_rate} lessons per week until caught up`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Week {progressionData.weeks_since_join}</p>
                        <p className="text-sm text-gray-500">Current: Week {progressionData.current_week}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Completed</p>
                      <p className="font-bold text-gray-900">{progressionData?.total_completed || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg Score</p>
                      <p className="font-bold text-gray-900">{averageScore}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Flame className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Streak</p>
                      <p className="font-bold text-gray-900">{streakData?.currentStreak || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Time</p>
                      <p className="font-bold text-gray-900">{formatTime(totalTimeSpent)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Right Side */}
            <div className="space-y-6">
              
              {/* Weekly Streak */}
              {streakData && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span>Learning Streak</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {streakData.currentStreak}
                      </div>
                      <p className="text-sm text-gray-600">Week Streak</p>
                      <p className="text-xs text-gray-500">consecutive weeks</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {streakData.thisWeekCompleted}
                      </div>
                      <p className="text-sm text-gray-600">This Week</p>
                      <p className="text-xs text-gray-500">lessons completed</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Weekly Average:</span>
                      <span className="font-medium text-gray-900">{streakData.weeklyCompletionRate} lessons/week</span>
                    </div>
                  </div>

                  {streakData.currentStreak >= 2 && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-800 font-medium">
                        🔥 You're on fire! Keep your streak going!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Learning Level */}
              {profile && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <span>Learning Level</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Current Level</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {profile?.preferred_level || 'Both'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleLevelChange('beginner')}
                        disabled={profile?.preferred_level === 'beginner'}
                        className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                          profile?.preferred_level === 'beginner'
                            ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Switch to Beginner
                      </button>
                      
                      <button
                        onClick={() => handleLevelChange('intermediate')}
                        disabled={profile?.preferred_level === 'intermediate'}
                        className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                          profile?.preferred_level === 'intermediate'
                            ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Switch to Intermediate
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Level changes preserve your completion credit across all content
                    </p>
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span>Achievements</span>
                </h3>
                
                <div className="space-y-3">
                  {(progressionData?.total_completed || 0) >= 1 && (
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">First Lesson!</p>
                        <p className="text-sm text-gray-600">Started your learning journey</p>
                      </div>
                    </div>
                  )}
                  
                  {(progressionData?.total_completed || 0) >= 5 && (
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Flame className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Getting Started!</p>
                        <p className="text-sm text-gray-600">Completed 5 lessons</p>
                      </div>
                    </div>
                  )}

                  {(progressionData?.total_completed || 0) >= 10 && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Lesson Master!</p>
                        <p className="text-sm text-gray-600">Completed 10 lessons</p>
                      </div>
                    </div>
                  )}

                  {averageScore >= 90 && (progressionData?.total_completed || 0) >= 3 && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">High Achiever!</p>
                        <p className="text-sm text-gray-600">90%+ average score</p>
                      </div>
                    </div>
                  )}

                  {progressionData?.is_caught_up && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">All Caught Up!</p>
                        <p className="text-sm text-gray-600">Reached current content</p>
                      </div>
                    </div>
                  )}
                  
                  {!progressionData?.total_completed && (
                    <div className="text-center py-4">
                      <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Complete lessons to unlock achievements!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription Status */}
              {profile?.subscription_tier === 'free' ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Unlock Full Access</span>
                  </h3>
                  <p className="text-blue-700 mb-4 text-sm">
                    You're on the free plan with sample lessons only. Upgrade to access our complete learning system!
                  </p>
                  <div className="space-y-2 text-sm text-blue-600 mb-4">
                    <p>• Complete lesson progression system</p>
                    <p>• ESL News + CLIL Science content</p>
                    <p>• Multi-language support options</p>
                    <p>• Progress tracking & achievements</p>
                  </div>
                  <Link 
                    href="/subscribe" 
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Choose Your Plan
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Subscription</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Current Plan</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {profile?.subscription_tier?.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        profile?.subscription_status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile?.subscription_status}
                      </span>
                    </div>
                      {/* ADD THE LANGUAGE SUPPORT NOTE HERE */}
      {profile?.subscription_tier === 'complete_plan' && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
          CLIL language support: {profile?.language_support || 'English'}.
          To change language support, please contact admin.
        </div>
      )}
                    <div className="pt-3 space-y-2">
                      <button 
                        onClick={() => router.push('/subscribe?upgrade=true')}
                        className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        Change Plan
                      </button>
                      
                      <Link 
  href="/billing"
  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
>
  Manage Billing
</Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Link 
                    href="/analytics" 
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>View Analytics</span>
                  </Link>
                  
                  {profile?.subscription_tier !== 'free' && (
  <Link 
    href="/billing"
    className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
  >
    <CreditCard className="h-4 w-4" />
    <span>Billing & Account</span>
  </Link>
                  )}
                  
                  <Link 
                    href="/subscribe" 
                    className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>{profile?.subscription_tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VOCABULARY REVIEW MODAL */}
      {showVocabReview && (
        <VocabularyReviewModal 
          vocabularyWords={vocabularyData.vocabularyWords}
          onClose={() => setShowVocabReview(false)}
          onComplete={(score) => {
            setShowVocabReview(false);
            console.log('Vocabulary review completed with score:', score);
            // You could save this score to the database here if desired
          }}
        />
      )}
    </>
  );
}