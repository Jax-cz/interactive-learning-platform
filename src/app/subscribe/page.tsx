'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

// Updated to match new 3-option business model
const SUBSCRIPTION_PLANS = {
  esl_only: {
    id: 'esl_only',
    name: 'ESL Plan',
    description: 'Access to all ESL news lessons for adults',
    price: 600, // $6.00 in cents
    priceId: 'price_1RrIDC1Bs1c9VoEoSflvqHq4',
    features: [
      'All ESL news lessons',
      'Beginner and intermediate levels',
      'Switch difficulty levels anytime',
      'Progress tracking',
      'Weekly new content',
      'English language only'
    ]
  },
  clil_plus: {
    id: 'clil_plus',
    name: 'CLIL + Language Support',
    description: 'CLIL science lessons with multi-language support',
    price: 600, // $6.00 in cents  
    priceId: 'price_1RrIFA1Bs1c9VoEodN8JLWdx',
    features: [
      'All CLIL science lessons',
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
    priceId: 'price_1RrIGT1Bs1c9VoEo6IRvK0YC',
    features: [
      'All ESL news lessons (adults)',
      'All CLIL science lessons (teenagers)', 
      'Beginner and intermediate levels',
      'Switch difficulty levels anytime',
      'Multi-language vocabulary support',
      'Choose your support language: EN, CZ, DE, FR, ES, PL',
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

  const handlePlanSelection = async (planId: string) => {
    if (processingCheckout) return;
    
    setSelectedPlan(planId);
    setProcessingCheckout(true);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS].priceId,
          planId: planId,
          userId: user.id
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
      setProcessingCheckout(false);
      setSelectedPlan(null);
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
                <span className="text-2xl">📰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">ESL Plan</h3>
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
                disabled={processingCheckout}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPlan === 'esl_only' && processingCheckout ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Choose ESL Plan'
                )}
              </button>
            </div>
          </div>

          {/* CLIL + Language Support Plan */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative hover:shadow-xl transition-shadow">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                POPULAR
              </span>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">CLIL + Language Support</h3>
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
                disabled={processingCheckout}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPlan === 'clil_plus' && processingCheckout ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Choose CLIL Plus'
                )}
              </button>
            </div>
          </div>

          {/* Complete Plan */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-300 p-8 relative hover:shadow-2xl transition-shadow">
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
                disabled={processingCheckout}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPlan === 'complete_plan' && processingCheckout ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Choose Complete Plan'
                )}
              </button>
            </div>
          </div>

        </div>

        {/* FAQ Section - Updated for 3 options */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
              <h3 className="font-semibold text-gray-900 mb-2">What's the difference between ESL and CLIL?</h3>
              <p className="text-gray-600">ESL focuses on English through interesting news articles (mainly for adults), while CLIL teaches science subjects in English (suitable for adults and teenagers).</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What languages are supported?</h3>
              <p className="text-gray-600">CLIL+ and Complete Plan include vocabulary support in English, Czech, German, French, Spanish, and Polish. Russian and Chinese languages will be added later.</p>
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