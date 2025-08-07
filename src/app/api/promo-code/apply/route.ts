import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json({ 
        error: 'Promo code and user ID are required' 
      }, { status: 400 });
    }

    // First validate the promo code with restriction fields
    const { data: promoCode, error: promoError } = await supabase
      .from('promo_codes')
      .select(`
        *,
        content_type_restriction,
        level_restriction,
        language_restriction
      `)
      .eq('code', code.toUpperCase())
      .single();

    if (promoError || !promoCode) {
      return NextResponse.json({ 
        error: 'Invalid promo code' 
      }, { status: 400 });
    }

    if (!promoCode.active) {
      return NextResponse.json({ 
        error: 'This promo code is no longer active' 
      }, { status: 400 });
    }

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This promo code has expired' 
      }, { status: 400 });
    }

    if (promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json({ 
        error: 'This promo code has reached its usage limit' 
      }, { status: 400 });
    }

    // Check if user already used a promo code
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('promo_code_used')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 400 });
    }

    if (user.promo_code_used) {
      return NextResponse.json({ 
        error: 'You have already used a promo code' 
      }, { status: 400 });
    }

    // Calculate trial expiry date
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + promoCode.free_days);

    // Apply promo code to user with restrictions
    const { error: updateError } = await supabase
      .rpc('apply_promo_code_with_restrictions', {
        p_user_id: userId,
        p_promo_code: promoCode.code,
        p_free_days: promoCode.free_days,
        p_trial_expires: trialExpiresAt.toISOString(),
        p_content_restriction: promoCode.content_type_restriction,
        p_level_restriction: promoCode.level_restriction,
        p_language_restriction: promoCode.language_restriction
      });

    if (updateError) {
      console.error('Apply promo code error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to apply promo code' 
      }, { status: 500 });
    }

    // Build success message
    let accessMessage = `${promoCode.free_days} days free access`;
    const restrictions = [];
    
    if (promoCode.content_type_restriction) {
      restrictions.push(promoCode.content_type_restriction.toUpperCase());
    }
    
    if (promoCode.level_restriction) {
      restrictions.push(promoCode.level_restriction + ' level');
    }
    
    if (promoCode.language_restriction) {
      restrictions.push(promoCode.language_restriction + ' support');
    }
    
    if (restrictions.length > 0) {
      accessMessage += ` to ${restrictions.join(' + ')}`;
    }

    return NextResponse.json({
      success: true,
      message: `Promo code applied! You now have ${accessMessage}.`,
      free_days: promoCode.free_days,
      trial_expires_at: trialExpiresAt.toISOString(),
      restrictions: {
        content_type: promoCode.content_type_restriction,
        level: promoCode.level_restriction,
        language: promoCode.language_restriction
      }
    });

  } catch (error) {
    console.error('Promo code application error:', error);
    return NextResponse.json(
      { error: 'Failed to apply promo code' },
      { status: 500 }
    );
  }
}