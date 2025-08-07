import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch all lessons with week_number = '000' (sample lessons)
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('week_number', '000')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sample lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sample lessons' },
        { status: 500 }
      );
    }

    return NextResponse.json(lessons || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}