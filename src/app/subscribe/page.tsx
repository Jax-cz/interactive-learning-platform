'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

// Updated to match new 3-option business model
const SUBSCRIPTION_PLANS = {
  esl_only: {
    id: 'esl_only',
    name: 'News Article Plan',
    description: 'Access to all News article lessons for adults',
    price: 600, // $6.00 in cents
    priceId: 'price_1RvfVX1Bs1c9VoEosolWxJlo',
    features: [
      'All News article lessons (English only)',
  'Adult-focused current events content',
  'Beginner and intermediate levels',
  'Switch difficulty levels anytime',
  'Progress tracking',
  'Weekly new content',
  'No native language support'
    ]
  },
  clil_plus: {
    id: 'clil_plus',
    name: 'Science + Language Support',
    description: 'Science article lessons with multi-language support',
    price: 600, // $6.00 in cents  
    priceId: 'price_1RvfWo1Bs1c9VoEowauWnLQb',
    features: [
      'All Science article lessons',
      'Beginner and intermediate levels',
      'Switch difficulty levels anytime',
      'Multi-language vocabulary support',
      'Choose your support language: EN, CZ, DE, FR, ES, PL',
      'Progress tracking',
      'Weekly new content'
    ]
  },
  complete_plan: {
    id: 'complete_plan',
    name: 'Complete Plan',
    description: 'Everything! ESL + CLIL with language support of your choice',
    price: 900, // $9.00 in cents
    priceId: 'price_1RvfXm1Bs1c9VoEoYDZuJMog',
    features: [
      'All News article lessons (English only)',
  'All Science article lessons (with language support)', 
  'Beginner and intermediate levels',
  'Switch difficulty levels anytime',
  'Multi-language vocabulary support for Science content',
  'Choose your CLIL support language: EN, CZ, DE, FR, ES, PL',
  'Progress tracking across all content',
  'Weekly new content in both categories',
  'Best value - includes everything'
    ],
    isBundle: true,
    savings: 'Save $3/month vs separate plans'
  }
};

// Format price function
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export default function SubscribePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user: currentUser, error } = await getCurrentUser();
    
    if (error || !currentUser) {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);
    setLoading(false);
  };

  // IMPROVED SCROLL FUNCTIONS
  const scrollToLevelSelection = () => {
    setTimeout(() => {
      const levelSection = document.getElementById('level-selection');
      if (levelSection) {
        const headerOffset = 80; // Reduced offset for better positioning
        const elementPosition = levelSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 400); // Increased from 150ms to 400ms
  };

  const scrollToNextSection = (planType: string) => {
    setTimeout(() => {
      if (planType.includes('clil') || planType.includes('complete')) {
        // Scroll to language selection
        const languageSection = document.getElementById('language-selection');
        if (languageSection) {
          const headerOffset = 80;
          const elementPosition = languageSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      } else {
        // ESL plan - scroll to payment (centered)
        scrollToPaymentCentered();
      }
    }, 400); // Increased from 100-150ms to 400ms
  };

  const scrollToPaymentCentered = () => {
    setTimeout(() => {
      const subscribeSection = document.getElementById('subscribe-section');
      if (subscribeSection) {
        // Calculate center position
        const elementRect = subscribeSection.getBoundingClientRect();
        const elementHeight = elementRect.height;
        const viewportHeight = window.innerHeight;
        
        // Center the element in viewport
        const centerOffset = (viewportHeight - elementHeight) / 2;
        const elementPosition = elementRect.top + window.pageYOffset;
        const centeredPosition = elementPosition - centerOffset;
        
        window.scrollTo({
          top: Math.max(0, centeredPosition), // Ensure we don't scroll above page top
          behavior: 'smooth'
        });
      }
    }, 400); // Increased from 100ms to 400ms
  };

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
    // Reset level and language when plan changes
    setSelectedLevel(null);
    setSelectedLanguage(null);
    
    // Use improved scroll function
    scrollToLevelSelection();
  };

  // Helper functions for plan information
  const getPlanName = (priceId: string) => {
    if (priceId.includes('esl') || priceId === 'price_1RvfVX1Bs1c9VoEosolWxJlo') return 'News article Plan';
    if (priceId.includes('clil') || priceId === 'price_1RvfWo1Bs1c9VoEowauWnLQb') return 'Science + Language Support';
    if (priceId.includes('complete') || priceId === 'price_1RvfXm1Bs1c9VoEoYDZuJMog') return 'Complete Plan';
    return 'Plan';
  };

  const getPlanPrice = (priceId: string) => {
    if (priceId === 'price_1RvfXm1Bs1c9VoEoYDZuJMog') return '9'; // Complete Plan
    return '6'; // ESL and CLIL Plus
  };

  const getPlanTier = (priceId: string) => {
    if (priceId === 'price_1RvfVX1Bs1c9VoEosolWxJlo') return 'esl_only';
    if (priceId === 'price_1RvfWo1Bs1c9VoEowauWnLQb') return 'clil_plus';
    if (priceId === 'price_1RvfXm1Bs1c9VoEoYDZuJMog') return 'complete_plan';
    return 'free';
  };

  // Get the actual price ID based on selected plan
  const getSelectedPriceId = () => {
    if (selectedPlan === 'esl_only') return 'price_1RvfVX1Bs1c9VoEosolWxJlo';
    if (selectedPlan === 'clil_plus') return 'price_1RvfWo1Bs1c9VoEowauWnLQb';
    if (selectedPlan === 'complete_plan') return 'price_1RvfXm1Bs1c9VoEoYDZuJMog';
    return '';
  };

  const handleSubscribe = async () => {
    if (processingCheckout) return;
    setProcessingCheckout(true);

    try {
      const priceId = getSelectedPriceId();
      
      // Map "English Only" to "English" for database storage
      const languageForDatabase = selectedLanguage === 'English Only' ? 'English' : selectedLanguage;
      
      // Create Stripe checkout session with all user selections
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: user.id,
          userPreferences: {
            level: selectedLevel,
            language_support: languageForDatabase || 'English',
            subscription_tier: getPlanTier(priceId)
          }
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert('Error creating checkout session: ' + error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setProcessingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Interactive Learning
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Learning Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock your English learning potential with our interactive lessons. 
            Choose the plan that fits your learning goals and start your journey today.
          </p>
        </div>

        {/* Pricing Cards - Updated to 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* ESL Plan */}
          <div className={`bg-white rounded-2xl shadow-lg border-2 p-8 relative hover:shadow-xl transition-all ${
            selectedPlan === 'esl_only' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
          }`}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
                <span className="text-2xl">📰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">News Article Plan</h3>
              <p className="text-gray-600 mb-6">Perfect for adults learning English through current events</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(SUBSCRIPTION_PLANS.esl_only.price)}
                </span>
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="text-left space-y-3 mb-8">
                {SUBSCRIPTION_PLANS.esl_only.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection('esl_only')}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedPlan === 'esl_only' 
                    ? 'bg-orange-700 text-white' 
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {selectedPlan === 'esl_only' ? 'Selected ✓' : 'Choose News Article Plan'}
              </button>
            </div>
          </div>

          {/* CLIL + Language Support Plan */}
          <div className={`bg-white rounded-2xl shadow-lg border-2 p-8 relative hover:shadow-xl transition-all ${
            selectedPlan === 'clil_plus' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
          }`}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                POPULAR
              </span>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Science + Language Support</h3>
              <p className="text-gray-600 mb-6">Science learning with multi-language vocabulary support</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(SUBSCRIPTION_PLANS.clil_plus.price)}
                </span>
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="text-left space-y-3 mb-8">
                {SUBSCRIPTION_PLANS.clil_plus.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection('clil_plus')}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedPlan === 'clil_plus' 
                    ? 'bg-purple-700 text-white' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {selectedPlan === 'clil_plus' ? 'Selected ✓' : 'Choose Science Plan'}
              </button>
            </div>
          </div>

          {/* Complete Plan */}
          <div className={`bg-white rounded-2xl shadow-xl border-2 p-8 relative hover:shadow-2xl transition-all ${
            selectedPlan === 'complete_plan' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-300'
          }`}>
            {/* Best Value Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                BEST VALUE
              </span>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Plan</h3>
              <p className="text-gray-600 mb-6">Everything! ESL + CLIL with language support</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(SUBSCRIPTION_PLANS.complete_plan.price)}
                </span>
                <span className="text-gray-600">/month</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-blue-800 font-semibold text-sm">
                  {SUBSCRIPTION_PLANS.complete_plan.savings}
                </p>
              </div>

              <ul className="text-left space-y-3 mb-8">
                {SUBSCRIPTION_PLANS.complete_plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection('complete_plan')}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedPlan === 'complete_plan' 
                    ? 'bg-blue-700 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {selectedPlan === 'complete_plan' ? 'Selected ✓' : 'Choose Complete Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Level Selection - appears after plan selection */}
        {selectedPlan && (
          <div id="level-selection" className="mt-8 bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              What's your English level?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedLevel('beginner');
                  scrollToNextSection(selectedPlan);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedLevel === 'beginner'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Beginner-Lower Intermediate</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Basic English skills, simple conversations
                  </p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedLevel('intermediate');
                  scrollToNextSection(selectedPlan);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedLevel === 'intermediate'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Intermediate-Upper Intermediate</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Good English skills, complex topics
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Language Selection - appears for CLIL Plus and Complete plans */}
        {selectedPlan && selectedLevel && (selectedPlan.includes('clil') || selectedPlan.includes('complete')) && (
          <div id="language-selection" className="mt-8 bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Choose your CLIL language support:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['English Only', 'Czech', 'German', 'French', 'Spanish', 'Polish'].map((language) => (
                <button
                  key={language}
                  onClick={() => {
                    setSelectedLanguage(language);
                    scrollToPaymentCentered();
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedLanguage === language
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="font-medium">{language}</span>
                    {language === 'English Only' && (
                      <p className="text-xs text-gray-500 mt-1">No translation support</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subscribe Button - appears when all required selections made */}
        {selectedPlan && selectedLevel && (
          // For ESL: only need plan + level
          (selectedPlan.includes('esl') || 
           // For CLIL/Complete: need plan + level + language
           ((selectedPlan.includes('clil') || selectedPlan.includes('complete')) && selectedLanguage)
          ) && (
            <div id="subscribe-section" className="mt-8 max-w-4xl mx-auto text-center">
              <button
                onClick={handleSubscribe}
                disabled={processingCheckout}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processingCheckout ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Subscribe to ${getPlanName(getSelectedPriceId())} - ${getPlanPrice(getSelectedPriceId())}/month`
                )}
              </button>
            </div>
          )
        )}

        {/* FAQ Section - Updated for 3 options */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What's the difference between News and Science articles?</h3>
              <p className="text-gray-600">News Articles focus on English through current events (mainly for adults), while Science Articles teach science subjects in English (suitable for adults and teenagers).</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What languages are supported?</h3>
              <p className="text-gray-600">Science and Complete Plan include vocabulary support in English, Czech, German, French, Spanish, and Polish. Russian and Chinese languages will be added later.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan later?</h3>
              <p className="text-gray-600">Yes! You can upgrade, downgrade, or cancel your subscription at any time from your dashboard.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I switch between difficulty levels?</h3>
              <p className="text-gray-600">Yes! You can change between beginner and intermediate levels every week to match your learning progress.</p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            🔒 Secure payment processing powered by Stripe. Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}