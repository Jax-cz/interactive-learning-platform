'use client';

import { useState } from 'react';
import Link from 'next/link';

// Slideshow Component
function PlatformSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const totalSlides = 16;

  const changeSlide = (direction: number) => {
    let newSlide = currentSlide + direction;
    
    if (newSlide > totalSlides) {
      newSlide = 1;
    }
    if (newSlide < 1) {
      newSlide = totalSlides;
    }
    
    setCurrentSlide(newSlide);
  };

  const goToSlide = (slideNumber: number) => {
    setCurrentSlide(slideNumber);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = 'unset'; // Restore scrolling
  };

  return (
    <>
      <div className="mb-12 bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="text-center py-8 px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            See How It Works
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Take a guided tour of our interactive learning platform
          </p>
          
          {/* Slideshow Container */}
          <div className="relative max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            
            {/* Current Slide */}
            <div className="relative cursor-pointer" onClick={openFullscreen}>
              <img 
                src={`/slides/${currentSlide}.png`} 
                alt={`Platform Demo - Step ${currentSlide}`} 
                className="w-full h-auto" 
              />
              
              {/* Mobile tap indicator */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs md:hidden">
                Tap to expand
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                changeSlide(-1);
              }}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                changeSlide(1);
              }}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Slide Counter */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
              {currentSlide} / {totalSlides}
            </div>
            
            {/* Dots Navigation */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {[...Array(totalSlides)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(index + 1);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index + 1 === currentSlide ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-4xl max-h-full flex items-center justify-center">
            
            {/* Close button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Fullscreen Image */}
            <img 
              src={`/slides/${currentSlide}.png`} 
              alt={`Platform Demo - Step ${currentSlide}`} 
              className="max-w-full max-h-full object-contain" 
            />
            
            {/* Navigation Buttons - Fullscreen */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                changeSlide(-1);
              }}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-4 rounded-full transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                changeSlide(1);
              }}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-4 rounded-full transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Slide Counter - Fullscreen */}
            <div className="absolute bottom-8 right-8 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full">
              {currentSlide} / {totalSlides}
            </div>
            
            {/* Dots Navigation - Fullscreen */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
              {[...Array(totalSlides)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(index + 1);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index + 1 === currentSlide ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
        {/* Welcome Message Section */}
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

        {/* Platform Demo Slideshow */}
        <PlatformSlideshow />

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
                        
        {/* Step 2: Content Type Selection */}
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

        {/* Step 3: Language Selection */}
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
                <div className="text-3xl mb-2">🌍</div>
                <div className="font-semibold text-gray-600">More Languages</div>
                <div className="text-sm text-gray-500">Coming Soon</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Need Help or Have Questions?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Get in touch with us! We're here to help you on your language learning journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <a
              href="mailto:info@bltc.cz"
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Us
            </a>
            
            <a
              href="https://instagram.com/easy_language_learnin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Follow Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}