// src/lib/stripe-server.ts
import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

// Subscription plan configurations - UPDATED TO 3 TIERS ONLY
export const SUBSCRIPTION_PLANS = {
  esl_only: {
    id: 'esl_only',
    name: 'ESL Plan',
    description: 'Access to all ESL news lessons for adults',
    price: 600, // $6.00 in cents
    priceId: 'price_1S7ETR1Bs1c9VoEoGpZnsbNZ', // Your actual Stripe Price ID
    currency: 'usd',
    interval: 'month',
    features: [
      'All ESL news lessons',
      'Both beginner and intermediate levels',
      'Real-world current events',
      'Progress tracking',
      'Weekly new content'
    ]
  },
  clil_plus: {
    id: 'clil_plus',
    name: 'CLIL + Language Support',
    description: 'CLIL science lessons with multi-language support',
    price: 600, // $6.00 in cents - SAME PRICE AS ESL
    priceId: 'price_1S7ETO1Bs1c9VoEopYgVUIzO', // Your actual Stripe Price ID
    currency: 'usd', 
    interval: 'month',
    features: [
      'All CLIL science lessons',
      'Both beginner and intermediate levels',
      'Multi-language support (Czech, German, French, Spanish, Polish)',
      'Vocabulary translations in your native language',
      'Progress tracking',
      'Weekly new content'
    ]
  },
  complete_plan: {
    id: 'complete_plan',
    name: 'Complete Plan',
    description: 'Everything! ESL + CLIL with language support of your choice',
    price: 900, // $9.00 in cents - BEST VALUE
    priceId: 'price_1S7ETH1Bs1c9VoEouBBsNy3q', // Your actual Stripe Price ID
    currency: 'usd',
    interval: 'month',
    features: [
      'All ESL news lessons (adults)',
      'All CLIL science lessons (teenagers)', 
      'Both beginner and intermediate levels',
      'Multi-language support for CLIL content',
      'Choose your language support level',
      'Progress tracking across all content',
      'Weekly new content in both categories',
      'Best value - save $3/month vs separate plans'
    ],
    isBundle: true,
    savings: 'Save $3/month vs separate plans',
    popular: true
  }
};

// Helper function to get plan details
export function getPlanDetails(planId: string) {
  return SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
}

// Helper function to get plan by Stripe Price ID
export function getPlanByPriceId(priceId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.priceId === priceId);
}

// Helper function to format price for display
export function formatPrice(cents: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

// Get all available plans (for subscription page)
export function getAllPlans() {
  return Object.values(SUBSCRIPTION_PLANS);
}