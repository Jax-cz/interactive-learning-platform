'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// Add this right after the imports
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase.from('lessons').select('count');
    if (error) {
      console.error('Connection test failed:', error);
    } else {
      console.log('Connection test successful:', data);
    }
  } catch (err) {
    console.error('Connection test error:', err);
  }
};
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Lesson {
  id: string;
  title: string;
  level: string;
  content_type: string;
  language_support: string;
  week_number: number;
  image_filename: string;
  created_at: string;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    contentType: 'all', // 'all', 'esl', 'clil'
    level: 'all', // 'all', 'beginner', 'intermediate'
    language: 'all' // 'all', 'english', 'czech', etc.
  });

  // Mock user subscription data (we'll connect to real auth later)
  const userSubscription = {
  tier: 'clil', // Changed this
  level: 'intermediate',
  language: 'english'
};

  const filterBySubscription = (lessons: Lesson[]) => {
    return lessons.filter(lesson => {
      switch (userSubscription.tier) {
        case 'esl':
          return lesson.content_type === 'esl';
        case 'clil':
          return lesson.content_type === 'clil' && lesson.language_support === 'english';
        case 'clil_plus_language':
          return lesson.content_type === 'clil'; // All CLIL lessons
        default:
          return false;
      }
    });
  };

  useEffect(() => {
    testConnection();
    fetchLessons();
  }, [filter]);

const fetchLessons = async () => {
  try {
    setLoading(true);
    
    console.log('Fetching lessons with filters...');
    
    let query = supabase
      .from('lessons')
      .select('*')
      .eq('published', true)
      .order('week_number', { ascending: false });

    // Apply user's manual filters first
    if (filter.contentType !== 'all') {
      query = query.eq('content_type', filter.contentType);
    }
    if (filter.level !== 'all') {
      query = query.eq('level', filter.level);
    }
    if (filter.language !== 'all') {
      query = query.eq('language_support', filter.language);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    } else {
      console.log('Raw lessons found:', data?.length || 0);
      
      // Apply rolling 4-week filter in JavaScript (more reliable)
      const currentWeek = Math.max(...(data?.map(l => l.week_number) || [1])); // Get highest week number
      const minWeek = Math.max(1, currentWeek - 3);
      
      const filteredLessons = data?.filter(lesson => 
        lesson.week_number >= minWeek && lesson.week_number <= currentWeek
      ) || [];
      
      console.log(`Showing weeks ${minWeek}-${currentWeek}, found ${filteredLessons.length} lessons`);
      setLessons(filteredLessons);
    }
  } catch (error) {
    console.error('Fetch lessons error:', error);
    setLessons([]);
  } finally {
    setLoading(false);
  }
};

  const getSubscriptionBadgeColor = () => {
    switch (userSubscription.tier) {
      case 'esl': return 'bg-orange-100 text-orange-800';
      case 'clil': return 'bg-purple-100 text-purple-800';
      case 'clil_plus_language': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionLabel = () => {
    switch (userSubscription.tier) {
      case 'esl': return 'ESL Only';
      case 'clil': return 'CLIL English';
      case 'clil_plus_language': return 'CLIL + Language Support';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Lessons</h1>
              <p className="text-gray-600 mt-1">Interactive English learning content</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionBadgeColor()}`}>
              {getSubscriptionLabel()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Lessons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Content Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={filter.contentType}
                onChange={(e) => setFilter({...filter, contentType: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="esl">ESL (News)</option>
                <option value="clil">CLIL (Science)</option>
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={filter.level}
                onChange={(e) => setFilter({...filter, level: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language Support
              </label>
              <select
                value={filter.language}
                onChange={(e) => setFilter({...filter, language: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => {
  window.location.href = `/lessons/${lesson.id}`;
}}
              >
                {/* Lesson Image */}
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img
                    src={`/images/lessons/${lesson.image_filename}.jpg`}
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image doesn't exist
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

                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Start Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}