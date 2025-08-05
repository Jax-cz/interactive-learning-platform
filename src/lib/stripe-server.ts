// src/lib/stripe-server.ts
import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

// Subscription plan configurations with actual Stripe Price IDs
export const SUBSCRIPTION_PLANS = {
  esl_only: {
    id: 'esl_only',
    name: 'ESL Only',
    description: 'Access to all ESL news lessons for adults',
    price: 600, // $6.00 in cents
    priceId: 'price_1RrIDC1Bs1c9VoEoSflvqHq4', // Your actual Stripe Price ID
    currency: 'usd',
    interval: 'month',
    features: [
      'All ESL news lessons',
      'Both beginner and intermediate levels',
      'Progress tracking',
      'Weekly new content'
    ]
  },
  clil_only: {
    id: 'clil_only', 
    name: 'CLIL Only',
    description: 'Access to all CLIL science lessons (English only)',
    price: 600, // $6.00 in cents
    priceId: 'price_1RrIE21Bs1c9VoEo1ada7Gt3', // Your actual Stripe Price ID
    currency: 'usd',
    interval: 'month',
    features: [
      'All CLIL science lessons',
      'Both beginner and intermediate levels',
      'English language only',
      'Progress tracking',
      'Weekly new content'
    ]
  },
  clil_plus: {
    id: 'clil_plus',
    name: 'CLIL Plus',
    description: 'CLIL lessons with multi-language support',
    price: 800, // $8.00 in cents
    priceId: 'price_1RrIFA1Bs1c9VoEodN8JLWdx', // Your actual Stripe Price ID
    currency: 'usd', 
    interval: 'month',
    features: [
      'All CLIL science lessons',
      'Both beginner and intermediate levels',
      'Multi-language support (Czech, German, French, Spanish, Polish)',
      'Vocabulary translations',
      'Progress tracking',
      'Weekly new content',
      'Premium support'
    ]
  },
  complete_plan: {
    id: 'complete_plan',
    name: 'Complete Learning Plan',
    description: 'Full access to both ESL and CLIL content - choose your language support level',
    price: 1000, // $10.00 in cents
    priceId: 'price_1RrIGT1Bs1c9VoEo6IRvK0YC', // Your actual Stripe Price ID
    currency: 'usd',
    interval: 'month',
    features: [
      'All ESL news lessons (adults)',
      'All CLIL science lessons (teenagers)', 
      'Both beginner and intermediate levels',
      'Choose: English only OR Multi-language support',
      'Progress tracking across all content',
      'Weekly new content in both categories',
      'Best value - includes everything'
    ],
    isBundle: true,
    savings: 'Save $2-4/month vs separate plans',
    options: [
      'English only (ESL + CLIL)',
      'With language support (ESL + CLIL Plus)'
    ]
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