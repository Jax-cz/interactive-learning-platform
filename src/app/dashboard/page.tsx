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

type Lesson = {
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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [contentAccess, setContentAccess] = useState<any>(null);
  const [progressionData, setProgressionData] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
    
    // Set up session monitoring
    const sessionCheck = setInterval(async () => {
      const isValid = await isSessionValid();
      if (!isValid) {
        console.log('Session expired, redirecting to login...');
        router.push('/login');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(sessionCheck);
  }, []);

  useEffect(() => {
    // Monitor auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      // Check if user is authenticated
      const { user: currentUser, error: userError } = await getCurrentUser();
      
      if (userError || !currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Get user profile - create if doesn't exist
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
            preferred_language: 'en',
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

      // Get content access permissions
      const access = await getContentAccess(currentUser.id);
      setContentAccess(access);

      // Load user progress first
      await loadProgress(currentUser.id);

      // Calculate progression data
      const progression = await calculateProgressionData(currentUser.id, userProfile);
      setProgressionData(progression);

      // Get available lessons based on progression
      await loadLessonsWithProgression(currentUser.id, access, progression);

    } catch (err: any) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgressionData = async (userId: string, userProfile: UserProfile | null): Promise<ProgressionData> => {
    try {
      // Get total completed lessons (Cross-Level Credit system)
      const { data: completedLessons, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .eq('is_completed', true);

      if (progressError) throw progressError;

      const totalCompleted = completedLessons?.length || 0;

      // Calculate weeks since user joined
      const joinDate = new Date(userProfile?.created_at || new Date());
      const currentDate = new Date();
      const weeksSinceJoin = Math.floor((currentDate.getTime() - joinDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

      // Get current week number (latest lesson week)
      const { data: latestLesson } = await supabase
        .from('lessons')
        .select('week_number')
        .eq('is_published', true)
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

      const currentWeek = latestLesson?.week_number || 1;

      // Calculate available lessons based on our agreed system
      const starterPack = 5;
      let availableLessons = starterPack;

      // Determine unlock rate (2 for catch-up, 1 for maintenance)
      const weeksBehind = currentWeek - weeksSinceJoin;
      const unlockRate = weeksBehind > 4 ? 2 : 1; // Catch-up mode if more than 4 weeks behind

      // Calculate additional unlocks
      const additionalWeeks = Math.max(0, weeksSinceJoin - 1); // First week is starter pack
      availableLessons += additionalWeeks * unlockRate;

      // Cap at current week content
      availableLessons = Math.min(availableLessons, currentWeek);

      // Check if user has completed enough lessons to maintain unlock rate
      const lessonsNeededForUnlock = Math.max(0, availableLessons - 3 - totalCompleted);
      const canUnlockMore = lessonsNeededForUnlock === 0;

      // Calculate days until next unlock
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay() + 1) % 7);
      const daysUntilNextUnlock = Math.ceil((nextMonday.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));

      // Check if user is caught up
      const isCaughtUp = availableLessons >= currentWeek - 2; // Within 2 weeks of current

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

  const loadLessonsWithProgression = async (userId: string, access: any, progression: ProgressionData) => {
    try {
      let query = supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .order('week_number', { ascending: true });

      // Filter based on subscription
      if (access.canAccessESL && access.canAccessCLIL) {
        // Complete plan - show all
      } else if (access.canAccessESL) {
        query = query.eq('content_type', 'esl');
      } else if (access.canAccessCLIL) {
        query = query.eq('content_type', 'clil');
      } else {
        // Free user - only samples
        query = query.eq('is_sample', true);
      }

      // Filter by user's preferred level (if set)
      if (profile?.preferred_level) {
        query = query.eq('level', profile.preferred_level);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort lessons by week number and limit to available lessons
      const sortedLessons = (data || [])
        .sort((a, b) => a.week_number - b.week_number)
        .slice(0, progression.available_lessons + 5); // Show a few locked ones too

      setLessons(sortedLessons);
    } catch (err: any) {
      console.error('Lessons loading error:', err);
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
        return { text: 'ESL Only', color: 'orange' };
      case 'clil_only':
        return { text: 'CLIL Only', color: 'purple' };
      case 'clil_plus':
        return { text: 'CLIL Plus', color: 'blue' };
      case 'complete_plan':
        return { text: 'Complete Plan', color: 'green' };
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

  const badge = getSubscriptionBadge();
  const averageScore = progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + (p.percentage_score || 0), 0) / progress.length)
    : 0;
  const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Interactive Learning
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
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
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {progressionData?.total_completed || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Star className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {averageScore}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatTime(totalTimeSpent)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {progressionData?.available_lessons || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Learning Path */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Play className="h-5 w-5 text-blue-600" />
                <span>Your Learning Path</span>
              </h2>
              
              {lessons.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons available</h3>
                  <p className="text-gray-600">Check back soon for new content!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.slice(0, 8).map((lesson, index) => {
                    const lessonProgress = getProgressForLesson(lesson.id);
                    const status = getLessonStatus(lesson, index);
                    const StatusIcon = status.icon;

                    return (
                      <div 
                        key={lesson.id} 
                        className={`border rounded-lg p-4 transition-all ${
                          status.status === 'available' 
                            ? 'hover:shadow-md cursor-pointer border-blue-200 bg-blue-50' 
                            : status.status === 'completed'
                            ? 'border-green-200 bg-green-50'
                            : status.status === 'coming_soon'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        onClick={() => status.status === 'available' && router.push(`/lesson/${lesson.id}`)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${status.bg}`}>
                            <StatusIcon className={`h-6 w-6 ${status.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className={`font-medium truncate ${
                                status.status === 'available' ? 'text-blue-900' : 
                                status.status === 'completed' ? 'text-green-900' :
                                status.status === 'coming_soon' ? 'text-yellow-900' :
                                'text-gray-500'
                              }`}>
                                {String(lesson.week_number).padStart(3, '0')}. {lesson.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                lesson.content_type === 'esl' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {lesson.content_type.toUpperCase()}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700 capitalize">
                                {lesson.level}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>⏱️ {lesson.estimated_duration} min</span>
                              <span>📂 {lesson.topic_category}</span>
                              {lesson.language_support && lesson.language_support !== 'English' && (
                                <span>🌐 + {lesson.language_support}</span>
                              )}
                            </div>

                            {status.status === 'completed' && lessonProgress && (
                              <div className="mt-2 flex items-center space-x-2">
                                <span className="text-sm text-green-600 font-medium">
                                  Completed • Score: {lessonProgress.percentage_score}%
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(lessonProgress.completed_at || '')}
                                </span>
                              </div>
                            )}

                            {status.status === 'coming_soon' && progressionData && (
                              <div className="mt-2">
                                <span className="text-sm text-yellow-700 font-medium">
                                  Unlocks in {progressionData.days_until_next_unlock} day{progressionData.days_until_next_unlock > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}

                            {status.status === 'locked' && progressionData && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-500">
                                  Complete {progressionData.lessons_needed_for_unlock} more lesson{progressionData.lessons_needed_for_unlock > 1 ? 's' : ''} to unlock
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            {status.status === 'available' && (
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                Start Lesson
                              </button>
                            )}
                            {status.status === 'completed' && (
                              <button 
                                onClick={() => router.push(`/lesson/${lesson.id}`)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                              >
                                Review
                              </button>
                            )}
                            {(status.status === 'coming_soon' || status.status === 'locked') && (
                              <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium">
                                {status.status === 'coming_soon' ? 'Coming Soon' : 'Locked'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {lessons.length > 8 && (
                    <div className="text-center pt-4">
                      <Link 
                        href="/lessons" 
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All Lessons →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
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
                  
                  <div className="pt-3 space-y-2">
                    <button 
                      onClick={() => router.push('/subscribe?upgrade=true')}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      Change Plan
                    </button>
                    
                    <button 
                      onClick={handleBillingPortal}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Manage Billing
                    </button>
                  </div>
                </div>
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
                      {profile.preferred_level || 'Not set'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => handleLevelChange('beginner')}
                      disabled={profile.preferred_level === 'beginner'}
                      className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                        profile.preferred_level === 'beginner'
                          ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Switch to Beginner
                    </button>
                    
                    <button
                      onClick={() => handleLevelChange('intermediate')}
                      disabled={profile.preferred_level === 'intermediate'}
                      className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                        profile.preferred_level === 'intermediate'
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
                  <button 
                    onClick={handleBillingPortal}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Billing & Account</span>
                  </button>
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
  );
}