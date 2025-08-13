// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { supabase } from '@/lib/supabase';
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

// Handle successful checkout completion
async function handleCheckoutCompleted(session: any) {
  console.log('Processing checkout completion:', session.id);
  
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  
  if (!userId || !planId) {
    console.error('Missing userId or planId in checkout session metadata');
    return;
  }

  try {
    // Update user subscription status
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_tier: planId,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        stripe_customer_id: session.customer,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user subscription:', userError);
      return;
    }

    console.log(`Successfully activated subscription for user ${userId} with plan ${planId}`);

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription: any) {
  console.log('Processing subscription creation:', subscription.id);
  
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id;
  
  try {
    // Find user by Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Update user with new subscription info
    const planType = getPlanTypeFromPriceId(priceId);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: planType,
        subscription_status: status === 'active' ? 'active' : 'inactive',
        stripe_subscription_id: subscriptionId,
        subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user subscription:', updateError);
    } else {
      console.log(`Created subscription for user ${user.id} with plan ${planType}`);
    }

  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
  }
}

// Handle subscription updates (upgrades, downgrades)
async function handleSubscriptionUpdated(subscription: any) {
  console.log('Processing subscription update:', subscription.id);
  
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id;
  const planType = getPlanTypeFromPriceId(priceId);
  
  try {
    // Find user by subscription ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (userError || !user) {
      console.error('User not found for subscription:', subscriptionId);
      return;
    }

    // Update user subscription
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: planType,
        subscription_status: status === 'active' ? 'active' : 'inactive',
        subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
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

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing subscription deletion:', subscription.id);
  
  const subscriptionId = subscription.id;
  
  try {
    // Find user by subscription ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (userError || !user) {
      console.error('User not found for subscription:', subscriptionId);
      return;
    }

    // Update user to free tier
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_status: 'inactive',
        subscription_end_date: new Date().toISOString()
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (user) {
      await supabase
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          subscription_status: 'past_due'
        })
        .eq('id', user.id);

      console.log(`Set user ${user.id} to past_due status`);
    }
  }
}

// Helper function to map Stripe Price ID to plan type - UPDATED FOR 3 TIERS
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