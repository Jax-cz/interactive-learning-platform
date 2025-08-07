'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  level: string;
  content_type: string;
  language_support: string;
  week_number: string;
  image_filename: string | null;
}

export default function SamplesPage() {
  const [sampleLessons, setSampleLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  useEffect(() => {
    fetchSampleLessons();
  }, []);

  const fetchSampleLessons = async () => {
    try {
      // This will fetch lessons with week_number = '000' (your sample lessons)
      const response = await fetch('/api/lessons/samples');
      if (response.ok) {
        const lessons = await response.json();
        setSampleLessons(lessons);
      }
    } catch (error) {
      console.error('Error fetching sample lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = sampleLessons.filter(lesson => {
    const contentTypeMatch = selectedContentType === 'all' || lesson.content_type === selectedContentType;
    const levelMatch = selectedLevel === 'all' || lesson.level === selectedLevel;
    return contentTypeMatch && levelMatch;
  });

  const getContentTypeColor = (contentType: string) => {
    switch (contentType) {
      case 'esl': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'clil': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'esl': return '📰';
      case 'clil': return '🔬';
      default: return '📚';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sample lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Home
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-blue-600">
                Free Sample Lessons
              </h1>
            </div>
            <div className="space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Try Our Interactive Lessons Free
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience the quality of our content before you subscribe. These sample lessons showcase our interactive approach to learning English through real-world content.
          </p>
          
          {/* Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Interactive Exercises</h3>
              <p className="text-gray-600 text-sm">Drag-and-drop, matching, and comprehension activities</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="font-bold text-gray-900 mb-2">Real-World Content</h3>
              <p className="text-gray-600 text-sm">Current news and science topics, not artificial textbook content</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="font-bold text-gray-900 mb-2">Mobile Optimized</h3>
              <p className="text-gray-600 text-sm">Perfect experience on phones, tablets, and computers</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <select
            value={selectedContentType}
            onChange={(e) => setSelectedContentType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Content Types</option>
            <option value="esl">ESL (News Topics)</option>
            <option value="clil">CLIL (Science Topics)</option>
          </select>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner - Lower Intermediate</option>
            <option value="intermediate">Intermediate - Upper Intermediate</option>
          </select>
        </div>

        {/* Sample Lessons Grid */}
        {filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Lesson Image */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                  {lesson.image_filename ? (
                    <img 
                      src={`/images/lessons/${lesson.image_filename}`}
                      alt={lesson.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">
                      {getContentTypeIcon(lesson.content_type)}
                    </span>
                  )}
                </div>

                {/* Lesson Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getContentTypeColor(lesson.content_type)}`}>
                      {lesson.content_type.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {lesson.level === 'beginner' ? 'Beginner-Lower' : 'Intermediate-Upper'}
                    </span>
                    {lesson.language_support && lesson.language_support !== 'english' && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        +{lesson.language_support}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                    {lesson.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Sample Lesson
                    </span>
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Try Now →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Sample Lessons Yet</h3>
            <p className="text-gray-600 mb-6">
              We're preparing amazing sample lessons for you. Check back soon!
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready for Full Access?
          </h3>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Unlock hundreds of lessons, track your progress, and learn at your own pace with our complete platform.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">16+</div>
              <div className="text-gray-600">New lessons every month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">5</div>
              <div className="text-gray-600">Language support options</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">∞</div>
              <div className="text-gray-600">Progress tracking & analytics</div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/register"
              className="block sm:inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Start Your Subscription
            </Link>
            <Link
              href="/subscribe"
              className="block sm:inline-block border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-medium text-lg"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}