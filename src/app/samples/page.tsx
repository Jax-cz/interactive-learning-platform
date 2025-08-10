'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Lesson {
  id: string;
  title: string;
  level: string;
  content_type: string;
  language_support: string;
  image_filename: string;
  week_number: number;
}

// Separate component that uses useSearchParams
function SamplesContent() {
  const [samples, setSamples] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const level = searchParams.get('level') || 'beginner';
  const content = searchParams.get('content') || 'esl';
  const language = searchParams.get('language') || 'english';

  useEffect(() => {
    fetchSamples();
  }, [level, content, language]);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('lessons')
        .select('*')
        .eq('is_sample', true)
        .eq('level', level.toLowerCase())
        .order('content_type', { ascending: true });

      // Filter based on content choice
      if (content === 'esl') {
        query = query.eq('content_type', 'esl');
        setSelectedPlan('ESL Plan');
      } else if (content === 'clil-plus') {
        query = query
          .eq('content_type', 'clil')
          .eq('language_support', language); // Use exact capitalization from database
        setSelectedPlan('CLIL + Language Support');
      } else if (content === 'complete-plan') {
        // For complete plan, get both ESL and CLIL
        const { data: eslSamples } = await supabase
          .from('lessons')
          .select('*')
          .eq('is_sample', true)
          .eq('level', level.toLowerCase())
          .eq('content_type', 'esl')
          .limit(1);

        const { data: clilSamples } = await supabase
          .from('lessons')
          .select('*')
          .eq('is_sample', true)
          .eq('level', level.toLowerCase())
          .eq('content_type', 'clil')
          .eq('language_support', language) // Use exact capitalization from database
          .limit(1);

        const combinedSamples = [...(eslSamples || []), ...(clilSamples || [])];
        setSamples(combinedSamples);
        setSelectedPlan('Complete Plan');
        setLoading(false);
        return;
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching samples:', error);
      } else {
        setSamples(data || []);
      }
    } catch (error) {
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = () => {
    switch (content) {
      case 'esl': return '📰';
      case 'clil-plus': return '🔬';
      case 'complete-plan': return '🌍';
      default: return '📚';
    }
  };

  const getPlanColor = () => {
    switch (content) {
      case 'esl': return 'orange';
      case 'clil-plus': return 'purple';
      case 'complete-plan': return 'blue';
      default: return 'gray';
    }
  };

  const getLanguageFlag = (lang: string) => {
    const codes: { [key: string]: string } = {
      'Czech': 'CZ',
      'German': 'DE', 
      'French': 'FR',
      'Spanish': 'ES',
      'Polish': 'PL',
      'English': 'EN'
    };
    return codes[lang] || 'XX';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized samples...</p>
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
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold text-blue-600">
                Easy Language Learning Interactive Learning Platform
              </h1>
            </div>
            <div className="space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Plan Summary */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center px-6 py-3 rounded-full bg-${getPlanColor()}-100 text-${getPlanColor()}-800 mb-4`}>
            <span className="text-2xl mr-2">{getPlanIcon()}</span>
            <span className="font-semibold">{selectedPlan}</span>
            {language !== 'english' && (
              <>
                <span className="mx-2">•</span>
                <span className="text-lg mr-1">{getLanguageFlag(language)}</span>
                <span className="capitalize">{language} Support</span>
              </>
            )}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Try Your Free Samples
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
            Experience the complete interactive lesson - no signup required!
          </p>
          <p className="text-lg text-gray-500 capitalize">
            {level} Level • Complete Lesson Experience
          </p>
        </div>

        {/* Sample Lessons */}
        {samples.length > 0 ? (
          <div className="grid gap-8 mb-12">
            {samples.map((lesson) => (
              <div 
                key={lesson.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 overflow-hidden"
              >
                <div className="md:flex">
                  {/* Lesson Image */}
                  <div className="md:w-1/3">
                    <div className={`h-64 md:h-full bg-${getPlanColor()}-100 flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="text-8xl mb-4">
                          {lesson.content_type === 'esl' ? '📰' : '🔬'}
                        </div>
                        <div className="text-lg font-semibold text-gray-700 uppercase tracking-wide">
                          {lesson.content_type} Sample
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lesson Details */}
                  <div className="md:w-2/3 p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {lesson.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Free Sample
                          </span>
                          <span className="capitalize">{lesson.level} Level</span>
                          <span className="uppercase">{lesson.content_type}</span>
                          {lesson.language_support !== 'english' && (
                            <span className="flex items-center">
                              <span className="text-lg mr-1">{getLanguageFlag(lesson.language_support)}</span>
                              <span className="capitalize">{lesson.language_support} Support</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {lesson.content_type === 'esl' 
                        ? "Experience our interactive news-based English learning with real-world topics, vocabulary exercises, and comprehension activities."
                        : "Discover our CLIL approach combining science education with English learning, featuring bilingual vocabulary support and interactive experiments."
                      }
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">✨ Complete interactive experience</span>
                        <span className="block">📝 All exercises included</span>
                      </div>
                      
                      <Link
                        href={`/lessons/${lesson.id}?sample=true`}
                        className={`bg-${getPlanColor()}-600 text-white px-8 py-3 rounded-lg hover:bg-${getPlanColor()}-700 font-medium transition-colors shadow-lg hover:shadow-xl`}
                      >
                        Start Sample Lesson →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No samples available yet
            </h3>
            <p className="text-gray-600 mb-8">
              We're preparing amazing sample lessons for your selected preferences.
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        )}

        {/* Call to Action */}
        {samples.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready for unlimited access?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {content === 'complete-plan' 
                ? "Get unlimited access to all ESL news content AND CLIL science lessons with full language support."
                : content === 'clil-plus'
                ? "Get unlimited access to all CLIL science lessons with full language support in your chosen language."
                : "Get unlimited access to all ESL news-based English lessons with fresh content every week."
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={`/register?plan=${content}&level=${level}&language=${language}`}
                className={`bg-${getPlanColor()}-600 text-white px-8 py-4 rounded-lg hover:bg-${getPlanColor()}-700 font-medium text-lg transition-colors shadow-lg hover:shadow-xl`}
              >
                {getPlanIcon()} Get Full Access
              </Link>
              
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
              >
                ← Choose Different Plan
              </Link>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                New lessons every week • Cancel anytime • Mobile friendly
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function SamplesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading samples...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function SamplesPage() {
  return (
    <Suspense fallback={<SamplesLoading />}>
      <SamplesContent />
    </Suspense>
  );
}