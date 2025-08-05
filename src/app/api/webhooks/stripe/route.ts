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

    // Create subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        stripe_price_id: priceId,
        plan_type: getPlanTypeFromPriceId(priceId),
        status: status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      });

    if (subError) {
      console.error('Error creating subscription record:', subError);
    } else {
      console.log(`Created subscription record for user ${user.id}`);
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
    // Update subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        plan_type: planType,
        status: status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (subError) {
      console.error('Error updating subscription:', subError);
      return;
    }

    // Update user subscription tier
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subData) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_tier: planType,
          subscription_status: status === 'active' ? 'active' : 'inactive'
        })
        .eq('id', subData.user_id);

      if (userError) {
        console.error('Error updating user subscription tier:', userError);
      } else {
        console.log(`Updated user ${subData.user_id} to plan ${planType}`);
      }
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
    // Update subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (subError) {
      console.error('Error updating canceled subscription:', subError);
      return;
    }

    // Update user to free tier
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subData) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_tier: 'free',
          subscription_status: 'inactive',
          subscription_end_date: new Date().toISOString()
        })
        .eq('id', subData.user_id);

      if (userError) {
        console.error('Error updating user to free tier:', userError);
      } else {
        console.log(`Moved user ${subData.user_id} to free tier`);
      }
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
    // Ensure user subscription is active
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('user_id, plan_type')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subData) {
      await supabase
        .from('users')
        .update({
          subscription_status: 'active'
        })
        .eq('id', subData.user_id);

      console.log(`Confirmed active subscription for user ${subData.user_id}`);
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: any) {
  console.log('Processing failed payment:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    // Set user to past_due status
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subData) {
      await supabase
        .from('users')
        .update({
          subscription_status: 'past_due'
        })
        .eq('id', subData.user_id);

      console.log(`Set user ${subData.user_id} to past_due status`);
    }
  }
}

// Helper function to map Stripe Price ID to plan type
function getPlanTypeFromPriceId(priceId: string): string {
  const priceToPlansMap: { [key: string]: string } = {
    'price_1RrIDC1Bs1c9VoEoSflvqHq4': 'esl_only',
    'price_1RrIE21Bs1c9VoEo1ada7Gt3': 'clil_only',
    'price_1RrIFA1Bs1c9VoEodN8JLWdx': 'clil_plus',
    'price_1RrIGT1Bs1c9VoEo6IRvK0YC': 'complete_plan'
  };
  
  return priceToPlansMap[priceId] || 'free';
}