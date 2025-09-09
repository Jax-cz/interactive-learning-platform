// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';

// This is your Stripe webhook secret (we'll add this to .env.local)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle successful checkout completion - UPDATED TO HANDLE USER PREFERENCES
async function handleCheckoutCompleted(session: any) {
  console.log('Processing checkout completion:', session.id);
  console.log('Session metadata:', session.metadata);
  
  const userId = session.metadata?.userId;
  const level = session.metadata?.level || 'beginner';
  const language_support = session.metadata?.language_support || 'English';
  const subscription_tier = session.metadata?.subscription_tier || 'free';
  const priceId = session.metadata?.priceId;
  
  if (!userId) {
    console.error('Missing userId in checkout session metadata');
    return;
  }

  try {
    // Determine preferred content type based on subscription tier
    const preferred_content_type = getContentTypeFromTier(subscription_tier);
    
    // Update user with complete subscription data
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: subscription_tier,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        stripe_customer_id: session.customer,
        preferred_level: level,
        preferred_content_type: preferred_content_type,
        language_support: language_support,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user subscription:', userError);
      return;
    }

    console.log(`Successfully activated subscription for user ${userId}:`);
    console.log(`- Tier: ${subscription_tier}`);
    console.log(`- Level: ${level}`);
    console.log(`- Language: ${language_support}`);
    console.log(`- Content Type: ${preferred_content_type}`);

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}

// Handle subscription creation - UPDATED TO PRESERVE USER PREFERENCES
async function handleSubscriptionCreated(subscription: any) {
  console.log('Processing subscription creation:', subscription.id);
  console.log('Subscription metadata:', subscription.metadata);
  
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id;
  
  // Get user preferences from subscription metadata (set during checkout)
  const level = subscription.metadata?.level || 'beginner';
  const language_support = subscription.metadata?.language_support || 'English';
  const subscription_tier = subscription.metadata?.subscription_tier;
  
  try {
    // Find user by Stripe customer ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Get plan type from price ID if not in metadata
    const planType = subscription_tier || getPlanTypeFromPriceId(priceId);
    const preferred_content_type = getContentTypeFromTier(planType);
    
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: planType,
        subscription_status: status === 'active' ? 'active' : 'inactive',
        stripe_subscription_id: subscriptionId,
        subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        preferred_level: level,
        preferred_content_type: preferred_content_type,
        language_support: language_support
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user subscription:', updateError);
    } else {
      console.log(`Created subscription for user ${user.id}:`);
      console.log(`- Plan: ${planType}`);
      console.log(`- Level: ${level}`);
      console.log(`- Language: ${language_support}`);
    }

  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
  }
}

// Handle subscription updates (upgrades, downgrades) - UPDATED
async function handleSubscriptionUpdated(subscription: any) {
  console.log('Processing subscription update:', subscription.id);
  
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id;
  const planType = getPlanTypeFromPriceId(priceId);
  
  // Get user preferences from metadata if available
  const level = subscription.metadata?.level;
  const language_support = subscription.metadata?.language_support;
  
  try {
    // Find user by subscription ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, preferred_level, language_support')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (userError || !user) {
      console.error('User not found for subscription:', subscriptionId);
      return;
    }

    const preferred_content_type = getContentTypeFromTier(planType);
    
    // Update user subscription, preserving existing preferences if not in metadata
    const updateData: any = {
      subscription_tier: planType,
      subscription_status: status === 'active' ? 'active' : 'inactive',
      subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      preferred_content_type: preferred_content_type
    };
    
    // Only update preferences if they're provided in metadata
    if (level) updateData.preferred_level = level;
    if (language_support) updateData.language_support = language_support;

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user subscription:', updateError);
    } else {
      console.log(`Updated user ${user.id} to plan ${planType} with status ${status}`);
    }

  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error);
  }
}

// Handle subscription cancellation - FIXED TO USE CUSTOMER ID
async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing subscription deletion:', subscription.id);
  
  const customerId = subscription.customer; // Use customer ID instead of subscription ID
  
  try {
    // Find user by customer ID since subscription ID might be null
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Update user to free tier (keep preferences but remove access)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_status: 'inactive',
        subscription_end_date: new Date().toISOString(),
        preferred_content_type: 'free'
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user to free tier:', updateError);
    } else {
      console.log(`Moved user ${user.id} to free tier`);
    }

  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: any) {
  console.log('Processing successful payment:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    // Find user and ensure subscription is active
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (user) {
      await supabaseAdmin
        .from('users')
        .update({
          subscription_status: 'active'
        })
        .eq('id', user.id);

      console.log(`Confirmed active subscription for user ${user.id}`);
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: any) {
  console.log('Processing failed payment:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    // Find user and set to past_due status
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (user) {
      await supabaseAdmin
        .from('users')
        .update({
          subscription_status: 'past_due'
        })
        .eq('id', user.id);

      console.log(`Set user ${user.id} to past_due status`);
    }
  }
}

// Helper function to map Stripe Price ID to plan type
function getPlanTypeFromPriceId(priceId: string): string {
  const priceToPlansMap: { [key: string]: string } = {
    'price_1RvfVX1Bs1c9VoEosolWxJlo': 'esl_only',
    'price_1RvfWo1Bs1c9VoEowauWnLQb': 'clil_plus',
    'price_1RvfXm1Bs1c9VoEoYDZuJMog': 'complete_plan'
  };
  
  const planType = priceToPlansMap[priceId];
  
  if (!planType) {
    console.warn(`Unknown price ID: ${priceId}, defaulting to free`);
    return 'free';
  }
  
  return planType;
}

// NEW: Helper function to determine content type from subscription tier
function getContentTypeFromTier(tier: string): string {
  switch (tier) {
    case 'esl_only':
      return 'esl';
    case 'clil_plus':
      return 'clil';
    case 'complete_plan':
      return 'both';
    case 'free':
    default:
      return 'free';
  }
}