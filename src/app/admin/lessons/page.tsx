'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

export default function AdminLessonsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    contentType: 'all',
    level: 'all',
    language: 'all'
  });
  const router = useRouter();

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password === 'Loiza') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  // Load all lessons for admin
  const loadAdminLessons = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .order('week_number', { ascending: true });

      // Apply filters
      if (filter.contentType !== 'all') {
        query = query.eq('content_type', filter.contentType);
      }

      if (filter.level !== 'all') {
        query = query.eq('level', filter.level);
      }

      if (filter.language !== 'all') {
        const languageMap: { [key: string]: string } = {
          'english': 'English',
          'czech': 'Czech',
          'german': 'German',
          'french': 'French',
          'spanish': 'Spanish',
          'polish': 'Polish'
        };
        const targetLanguage = languageMap[filter.language] || filter.language;
        query = query.eq('language_support', targetLanguage);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log(`🔧 Admin loaded ${data?.length || 0} lessons`);
      setLessons(data || []);
    } catch (error) {
      console.error('Error loading admin lessons:', error);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminLessons();
    }
  }, [isAuthenticated, filter]);

  const handleLessonClick = (lesson: Lesson) => {
    router.push(`/lessons/${lesson.id}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Access Required</h1>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Admin Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Access Admin Panel
            </button>
          </form>
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
              <h1 className="text-3xl font-bold text-gray-900">Admin - All Lessons</h1>
              <p className="text-gray-600 mt-1">Complete lesson library management</p>
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Admin View
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
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No lessons found</h3>
            <p className="text-gray-600">Try adjusting your filters or upload new content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg cursor-pointer transition-all overflow-hidden"
                onClick={() => handleLessonClick(lesson)}
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
                    {lesson.week_number === 999 ? 'Sample' : `Week ${lesson.week_number}`}
                  </div>

                  <div className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-medium shadow-lg ${
                    lesson.content_type === 'esl' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-purple-500 text-white'
                  }`}>
                    {lesson.content_type.toUpperCase()}
                  </div>
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

                  <button className="w-full py-2 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    View Lesson
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