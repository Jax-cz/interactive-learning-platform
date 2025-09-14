// src/app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, userPreferences } = await request.json();

    // DEBUG LOGGING - Add these lines
    console.log('=== CHECKOUT SESSION DEBUG ===');
    console.log('Received priceId:', priceId);
    console.log('Received userId:', userId);
    console.log('Stripe key ending in:', process.env.STRIPE_SECRET_KEY?.slice(-4));
    console.log('================================');

    // Validate required parameters
    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: priceId and userId are required' },
        { status: 400 }
      );
    }

    // Extract user preferences (optional but recommended)
    const {
      level = 'beginner',
      language_support = 'English',
      subscription_tier = 'free'
    } = userPreferences || {};

    // Get user details from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let customerId = user.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
          level: level,
          language_support: language_support,
          subscription_tier: subscription_tier
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // DEBUG LOGGING - Add this line before Stripe call
    console.log('About to create Stripe session with priceId:', priceId);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/subscribe?canceled=true`,
      metadata: {
        userId: userId,
        level: level,
        language_support: language_support,
        subscription_tier: subscription_tier,
        priceId: priceId
      },
      subscription_data: {
        metadata: {
          userId: userId,
          level: level,
          language_support: language_support,
          subscription_tier: subscription_tier,
          priceId: priceId
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    // Optionally update user preferences in database immediately
    // (This will also be done via webhook, but doing it here provides immediate feedback)
    try {
      await supabase
        .from('users')
        .update({
          level_preference: level,
          language_support: language_support,
          subscription_tier: subscription_tier
        })
        .eq('id', userId);
    } catch (updateError) {
      // Don't fail the checkout if user update fails - webhook will handle it
      console.warn('Could not update user preferences immediately:', updateError);
    }

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}