import { NextRequest, NextResponse } from 'next/server';
import { saveLessonToDatabase, LessonData } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('API received body:', body);
    
    if (!body.title || !body.level || !body.content_type || !body.language_support) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const lessonData: LessonData = {
  title: body.title,
  level: body.level,
  content_type: body.content_type,
  language_support: body.language_support,
  filename: body.filename,
  content_data: body.content_data,
  published: body.published || false,
  week_number: body.week_number || 1,
  image_filename: body.image_filename 
};

    console.log('Saving lessonData:', lessonData);

    const result = await saveLessonToDatabase(lessonData);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Lesson saved successfully',
        data: result.data 
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API save lesson error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}