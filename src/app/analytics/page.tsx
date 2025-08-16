'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface LearningSession {
  lesson_id: string;
  lesson_title: string;
  content_type: string;
  level: string;
  completed_at: string;
  percentage_score: number;
  time_spent: number;
  week_number: number;
}

interface AnalyticsData {
  totalLessons: number;
  totalTimeSpent: number;
  averageScore: number;
  currentStreak: number;
}

export default function LearningAnalytics() {
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      console.log('Loading real analytics data...');
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.log('User not authenticated, redirecting...');
        router.push('/login');
        return;
      }

      console.log('User authenticated:', currentUser.email);
      setUser(currentUser);

      // DEBUG: First check what's in user_progress table
      const { data: allProgress, error: allProgressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', currentUser.id);

      console.log('ALL user progress records:', allProgress);
      console.log('All progress error:', allProgressError);

      // DEBUG: Check specifically for completed lessons
      const { data: completedProgress, error: completedError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('is_completed', true);

      console.log('COMPLETED progress records:', completedProgress);
      console.log('Completed error:', completedError);

      // Fetch user progress with lesson details (try both completed and all)
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          lesson_id,
          percentage_score,
          completed_at,
          is_completed,
          lessons!inner(
            title,
            content_type,
            level,
            week_number
          )
        `)
        .eq('user_id', currentUser.id);
        // Removed the is_completed filter to see all records

      console.log('Progress query result (ALL records):', progressData);

      if (progressError) {
        console.error('Progress query error:', progressError);
        throw new Error(`Database error: ${progressError.message}`);
      }

      // Filter for completed lessons in JavaScript instead
      const completedLessons = (progressData || []).filter(p => p.is_completed === true);
      console.log('Filtered completed lessons:', completedLessons);

      // Process the data
      const sessionData: LearningSession[] = completedLessons.map((p: any) => ({
        lesson_id: p.lesson_id,
        lesson_title: p.lessons?.title || 'Unknown Lesson',
        content_type: p.lessons?.content_type || 'esl',
        level: p.lessons?.level || 'beginner',
        completed_at: p.completed_at,
        percentage_score: p.percentage_score || 0,
        time_spent: 15, // Default estimated time since we don't have this column
        week_number: p.lessons?.week_number || 1
      }));

      console.log('Processed sessions:', sessionData);
      setSessions(sessionData);
      
      // Calculate analytics
      const analyticsData = calculateAnalytics(sessionData);
      console.log('Calculated analytics:', analyticsData);
      setAnalytics(analyticsData);

    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (sessions: LearningSession[]): AnalyticsData => {
    if (sessions.length === 0) {
      return {
        totalLessons: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        currentStreak: 0
      };
    }

    const totalLessons = sessions.length;
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.time_spent, 0);
    const averageScore = Math.round(sessions.reduce((sum, s) => sum + s.percentage_score, 0) / totalLessons);

    // Simple streak calculation - consecutive days
    const currentStreak = calculateSimpleStreak(sessions);

    return {
      totalLessons,
      totalTimeSpent,
      averageScore,
      currentStreak
    };
  };

  const calculateSimpleStreak = (sessions: LearningSession[]): number => {
  if (sessions.length === 0) return 0;
  
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  
  // Group sessions by week
  const sessionsByWeek = new Map<string, LearningSession[]>();
  
  sessions.forEach(session => {
    const sessionDate = new Date(session.completed_at);
    const weekKey = getWeekStart(sessionDate).toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!sessionsByWeek.has(weekKey)) {
      sessionsByWeek.set(weekKey, []);
    }
    sessionsByWeek.get(weekKey)!.push(session);
  });
  
  let streak = 0;
  let checkDate = new Date(currentWeekStart);
  
  // Check up to 26 weeks back (6 months)
  for (let i = 0; i < 26; i++) {
    const weekKey = checkDate.toISOString().split('T')[0];
    const weekSessions = sessionsByWeek.get(weekKey) || [];
    
    if (weekSessions.length > 0) {
      // User has activity this week - continue streak
      streak++;
      
      // Move to previous week
      checkDate.setDate(checkDate.getDate() - 7);
    } else {
      // No activity this week
      if (i === 0) {
        // Current week has no activity, check if we're still within grace period
        const daysSinceWeekStart = Math.floor((today.getTime() - currentWeekStart.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysSinceWeekStart <= 2) {
          // Grace period: It's still early in the learning week (Fri-Sat), check previous week
          checkDate.setDate(checkDate.getDate() - 7);
          continue;
        } else {
          // It's later in the week (Sun-Thu) with no activity, break streak
          break;
        }
      } else {
        // Past week with no activity - streak is broken
        break;
      }
    }
  }
  
  return streak;
};

// Helper function to get the start of the learning week (Friday)
// This aligns with your Friday content release schedule
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
  
  // Calculate days back to Friday
  // Friday = 0 days back, Saturday = 1 day back, ..., Thursday = 6 days back
  let daysBack;
  if (day >= 5) {
    // Friday (5) or Saturday (6) or Sunday (0)
    daysBack = day === 0 ? 2 : day - 5; // Sunday is 2 days after Friday
  } else {
    // Monday (1) through Thursday (4)
    daysBack = day + 2; // Monday is 4 days after Friday, Tuesday is 3, etc.
  }
  
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - daysBack);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-red-800 font-semibold mb-2">Analytics Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="block w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="block w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No completed lessons
  if (!analytics || analytics.totalLessons === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Complete some lessons to see your learning insights, progress trends, and achievements!
            </p>
            <div className="space-x-4">
              <Link 
                href="/lessons" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Start Learning
              </Link>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-blue-600 hover:text-blue-700"
              >
                ← Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {user?.email?.split('@')[0]}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lessons Completed</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalLessons}</p>
                <p className="text-sm text-green-600">Great progress!</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.averageScore}%</p>
                <p className="text-sm text-blue-600">Excellent work!</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Spent</p>
                <p className="text-3xl font-bold text-gray-900">{formatTime(analytics.totalTimeSpent)}</p>
                <p className="text-sm text-purple-600">Learning time</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.currentStreak}</p>
                <p className="text-sm text-orange-600">
  {analytics.currentStreak === 1 ? 'week active' : 'weeks in a row'}
</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Learning Sessions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Learning Sessions</h2>
          
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.slice(0, 10).map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      session.content_type === 'esl' ? 'bg-orange-500' : 'bg-purple-500'
                    }`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {String(session.week_number).padStart(3, '0')}. {session.lesson_title}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="uppercase">{session.content_type}</span>
                        <span>•</span>
                        <span className="capitalize">{session.level}</span>
                        <span>•</span>
                        <span>{formatDate(session.completed_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-medium">{session.percentage_score}%</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ~{formatTime(session.time_spent)} estimated
                      </div>
                    </div>
                    
                    <Link 
                      href={`/lesson/${session.lesson_id}`}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No learning sessions found.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link 
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Dashboard
          </Link>
          
          <Link 
            href="/lessons"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Continue Learning
          </Link>
        </div>
      </div>
    </div>
  );
}