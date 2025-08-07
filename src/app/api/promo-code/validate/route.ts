import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    // Fetch promo code from database with restriction fields
    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .select(`
        *,
        content_type_restriction,
        level_restriction,
        language_restriction
      `)
      .eq('code', code.toUpperCase())
      .single();

    if (error || !promoCode) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid promo code' 
      }, { status: 400 });
    }

    // Check if code is active
    if (!promoCode.active) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This promo code is no longer active' 
      }, { status: 400 });
    }

    // Check if code has expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This promo code has expired' 
      }, { status: 400 });
    }

    // Check if max uses reached
    if (promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This promo code has reached its usage limit' 
      }, { status: 400 });
    }

    // Build access description based on restrictions
    let accessDescription = `${promoCode.free_days} days free access`;
    const restrictions = [];
    
    if (promoCode.content_type_restriction) {
      restrictions.push(promoCode.content_type_restriction.toUpperCase());
    }
    
    if (promoCode.level_restriction) {
      restrictions.push(promoCode.level_restriction + ' level');
    }
    
    if (promoCode.language_restriction) {
      restrictions.push(promoCode.language_restriction + ' language support');
    }
    
    if (restrictions.length > 0) {
      accessDescription += ` to ${restrictions.join(' + ')}`;
    } else {
      accessDescription += ' to all content';
    }

    // Code is valid, return details
    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      free_days: promoCode.free_days,
      remaining_uses: promoCode.max_uses - promoCode.current_uses,
      description: promoCode.description,
      access_description: accessDescription,
      restrictions: {
        content_type: promoCode.content_type_restriction,
        level: promoCode.level_restriction,
        language: promoCode.language_restriction
      }
    });

  } catch (error) {
    console.error('Promo code validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}