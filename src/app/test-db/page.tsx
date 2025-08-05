'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DatabaseTest() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLessons() {
      try {
        console.log('Testing database connection...');
        
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .limit(5);

        if (error) {
          console.error('Database error:', error);
          setError(error.message);
        } else {
          console.log('Database connection successful!', data);
          setLessons(data || []);
        }
      } catch (err) {
        console.error('Connection error:', err);
        setError('Failed to connect to database');
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Database Connection Test
          </h1>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Testing connection...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-semibold">Connection Error:</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <div className="mt-4 text-sm text-red-600">
                <p><strong>Check:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Your .env.local file exists in the project root</li>
                  <li>NEXT_PUBLIC_SUPABASE_URL is correct</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY is correct</li>
                  <li>You restarted your development server after adding .env.local</li>
                </ul>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Database Connection Successful!
                </h3>
                <p className="text-green-600 mt-1">
                  Found {lessons.length} lesson(s) in the database
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sample Lessons in Database:
                </h3>
                {lessons.length === 0 ? (
                  <p className="text-gray-600">No lessons found. This is normal for a fresh database.</p>
                ) : (
                  <div className="space-y-4">
                    {lessons.map((lesson, index) => (
                      <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                              <p><span className="font-medium">Type:</span> {lesson.content_type.toUpperCase()}</p>
                              <p><span className="font-medium">Level:</span> {lesson.level}</p>
                              <p><span className="font-medium">Language:</span> {lesson.language}</p>
                              <p><span className="font-medium">Week:</span> {lesson.week_number}</p>
                              <p><span className="font-medium">Sample:</span> {lesson.is_sample ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lesson.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lesson.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-800 font-semibold">What This Means:</h3>
                <ul className="text-blue-600 mt-2 space-y-1 text-sm">
                  <li>✅ Your Next.js app can connect to Supabase</li>
                  <li>✅ Your database schema is working</li>
                  <li>✅ You can query lesson data</li>
                  <li>✅ Ready to build authentication system</li>
                </ul>
              </div>

              <div className="text-center">
                <a 
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ← Back to Homepage
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}