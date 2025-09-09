'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
  };

  const handleContentSelect = (contentType: string) => {
    setSelectedContentType(contentType);
    
    if (contentType === 'esl') {
      // ESL: Redirect directly to samples (no language selection needed)
      window.location.href = `/samples?level=${selectedLevel}&content=esl`;
    } else if (contentType === 'clil-plus' || contentType === 'complete-plan') {
      // CLIL Plus and Complete Plan: Show language selection first
      setShowLanguageSelection(true);
    }
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    
    // Direct redirect to samples with all parameters
    window.location.href = `/samples?level=${selectedLevel}&content=${selectedContentType}&language=${language}`;
  };

  const handleComplete = () => {
    // In a real app, this would save preferences and redirect
    console.log('Selected preferences:', {
      level: selectedLevel,
      contentType: selectedContentType,
      language: selectedLanguage
    });
    // For now, just show completion
    alert('Preferences saved! Ready to start learning.');
  };

  const resetToLevelSelection = () => {
    setSelectedLevel(null);
    setSelectedContentType(null);
    setShowLanguageSelection(false);
    setSelectedLanguage(null);
  };

  const resetToContentSelection = () => {
    setSelectedContentType(null);
    setShowLanguageSelection(false);
    setSelectedLanguage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold text-blue-600">
                Easy Language Learning Interactive Platform
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Message Section - ADD THIS */}
<div className="text-center mb-8 bg-white rounded-2xl shadow-lg p-8 md:p-12">
  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
    Discover Interactive English Learning That Actually Works
  </h2>
  
  <p className="text-base text-gray-600 mb-8 max-w-5xl mx-auto">
    We want you to experience our lessons firsthand before you subscribe. In just a few simple steps, you'll be trying real interactive lessons tailored to your level and interests.
  </p>
  
  <div className="bg-blue-50 rounded-xl p-6 mb-8">
    
    <div className="text-left max-w-2xl mx-auto space-y-3">
      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
        <div>
          <span className="font-semibold">Choose your level</span> - Select your current English proficiency
        </div>
      </div>
      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
        <div>
          <span className="font-semibold">Pick your content type</span> - News articles or Science topics
        </div>
      </div>
      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
        <div>
          <span className="font-semibold">Select language support</span> - Get vocabulary help in your native language (optional)
        </div>
      </div>
      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
        <div>
          <span className="font-semibold">Try sample lessons</span> - Experience our interactive format for free
        </div>
      </div>
      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
        <div>
          <span className="font-semibold">Subscribe if you love it</span> - Unlock access to weekly new content ($6 or $9/month)
        </div>
      </div>
    </div>
  </div>
  
</div>


        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {/* Step 1 */}
            <div className={`flex items-center ${selectedLevel ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                selectedLevel ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Level</span>
            </div>
            
            <div className={`w-8 h-1 ${selectedLevel ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            {/* Step 2 */}
            <div className={`flex items-center ${selectedContentType ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                selectedContentType ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Content</span>
            </div>
            
            <div className={`w-8 h-1 ${(selectedContentType === 'clil-plus' || selectedContentType === 'complete-plan') && showLanguageSelection ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            {/* Step 3 */}
            <div className={`flex items-center ${selectedLanguage ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                selectedLanguage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Language</span>
            </div>
          </div>
        </div>

        {/* Step 1: Level Selection */}
        {!selectedLevel && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Choose Your Level
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Select the difficulty level that matches your current English proficiency
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <button
                onClick={() => handleLevelSelect('beginner')}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-300 text-left"
              >
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Beginner - Lower Intermediate</h3>
                <p className="text-gray-600 mb-4">
                  Perfect for learners who are just starting or have basic English skills
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Simple vocabulary and grammar</li>
                  <li>• Clear explanations</li>
                  <li>• Gradual progression</li>
                </ul>
              </button>

              <button
                onClick={() => handleLevelSelect('intermediate')}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-300 text-left"
              >
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Intermediate - Upper Intermediate</h3>
                <p className="text-gray-600 mb-4">
                  Ideal for learners with solid fundamentals ready for more challenging content
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Complex vocabulary and structures</li>
                  <li>• Real-world applications</li>
                  <li>• Advanced topics</li>
                </ul>
              </button>
            </div>
          </div>
        )}
                        
        {/* Step 2: Content Type Selection - NOW WITH 3 OPTIONS */}
{selectedLevel && !selectedContentType && (
  <div className="animate-fade-in">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Choose Sample Lessons to Try
        </h2>
        <p className="text-xl text-gray-600 mt-2">
          Experience our interactive lessons before choosing your plan
        </p>
      </div>
      <button
        onClick={resetToLevelSelection}
        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
      >
        ← Back to Level
      </button>
    </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* ESL Option */}
              <button
                onClick={() => handleContentSelect('esl')}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-300 text-left"
              >
                <div className="w-full h-48 bg-orange-100 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-8xl">📰</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">News Articles</h3>
                <p className="text-gray-600 text-sm mb-3">
                  English through News articles and real-world topics
                </p>
                <div className="text-xs text-gray-500">
                  <p>Perfect for: Adults</p>
                  <p>Focus: Language skills through news</p>
                </div>
              </button>

              {/* CLIL with Language Support */}
              <button
                onClick={() => handleContentSelect('clil-plus')}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-300 text-left relative"
              >
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  Popular
                </div>
                <div className="w-full h-48 bg-purple-100 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-8xl">🔬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Science + Language Support</h3>
                <p className="text-gray-600 text-sm mb-3">
                  English and Science with vocabulary support in your native language
                </p>
                <div className="text-xs text-gray-500">
                  <p>Perfect for: Teenagers and Adults</p>
                  <p>Focus: Science + English + Native language</p>
                </div>
              </button>

              {/* Complete Plan Option */}
              <button
                onClick={() => handleContentSelect('complete-plan')}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-300 text-left relative"
              >
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Best Value
                </div>
                <div className="w-full h-48 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-8xl">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Plan</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Everything! News + Science with language support of your choice
                </p>
                <div className="text-xs text-gray-500">
                  <p>Perfect for: All learners</p>
                  <p>Focus: News + Science + Native language</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Language Selection - NOW SHOWS FOR BOTH clil-plus AND complete-plan */}
        {showLanguageSelection && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                Choose Your Support Language
              </h3>
              <button
                onClick={resetToContentSelection}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                ← Back to Content Types
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleLanguageSelect('English')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-3xl mb-2 font-bold text-gray-800">EN</div>
                <div className="font-semibold text-gray-800">English Only</div>
                <div className="text-sm text-gray-600">No translation support</div>
              </button>

              <button
                onClick={() => handleLanguageSelect('Czech')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-3xl mb-2 font-bold text-gray-800">CZ</div>
                <div className="font-semibold text-gray-800">Czech</div>
                <div className="text-sm text-gray-600">Čeština</div>
              </button>
              
              <button
                onClick={() => handleLanguageSelect('German')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-3xl mb-2 font-bold text-gray-800">DE</div>
                <div className="font-semibold text-gray-800">German</div>
                <div className="text-sm text-gray-600">Deutsch</div>
              </button>
              
              <button
                onClick={() => handleLanguageSelect('French')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-3xl mb-2 font-bold text-gray-800">FR</div>
                <div className="font-semibold text-gray-800">French</div>
                <div className="text-sm text-gray-600">Français</div>
              </button>
              
              <button
                onClick={() => handleLanguageSelect('Spanish')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-3xl mb-2 font-bold text-gray-800">ES</div>
                <div className="font-semibold text-gray-800">Spanish</div>
                <div className="text-sm text-gray-600">Español</div>
              </button>
              
              <button
                onClick={() => handleLanguageSelect('Polish')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-3xl mb-2 font-bold text-gray-800">PL</div>
                <div className="font-semibold text-gray-800">Polish</div>
                <div className="text-sm text-gray-600">Polski</div>
              </button>
              
              <div className="p-6 border-2 border-gray-100 rounded-xl bg-gray-50 text-center opacity-60">
                <div className="text-3xl mb-2">🌐</div>
                <div className="font-semibold text-gray-600">More Languages</div>
                <div className="text-sm text-gray-500">Coming Soon</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}