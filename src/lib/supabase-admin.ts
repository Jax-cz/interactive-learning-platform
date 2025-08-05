import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface LessonData {
  title: string;
  level: 'Beginner' | 'Intermediate';
  content_type: 'ESL' | 'CLIL';
  language_support: string;
  filename: string;
  content_data: any;
  published: boolean;
  week_number: number;
  release_date?: string;
  image_filename?: string;  // Add this line
}

export async function saveLessonToDatabase(lessonData: LessonData) {
  try {
   const { data, error } = await supabaseAdmin
  .from('lessons')
  .insert([{
    title: lessonData.title,
    level: lessonData.level,
    content_type: lessonData.content_type,
    language_support: lessonData.language_support,
    filename: lessonData.filename,
    content_data: lessonData.content_data,
    published: lessonData.published,
    week_number: lessonData.week_number,
    release_date: new Date().toISOString(),
    image_filename: lessonData.image_filename,  // Add this line
    created_at: new Date().toISOString()
  }])
      .select()

    if (error) {
      throw new Error(`Failed to save lesson: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Save lesson error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}