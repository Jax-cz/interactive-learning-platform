// scripts/auto-release.js
// This script automatically releases lessons based on their release_date

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function autoReleaseLessons() {
  try {
    console.log('🚀 Starting auto-release process...');
    console.log('Current date:', new Date().toISOString().split('T')[0]);

    // First, check what lessons are ready to be released
    const { data: readyLessons, error: checkError } = await supabase
      .from('lessons')
      .select('id, title, week_number, release_date, is_published')
      .eq('published', true)
      .eq('is_published', false)
      .lte('release_date', new Date().toISOString().split('T')[0]);

    if (checkError) {
      console.error('❌ Error checking lessons:', checkError);
      return;
    }

    if (!readyLessons || readyLessons.length === 0) {
      console.log('✅ No lessons ready for release today.');
      return;
    }

    console.log(`📚 Found ${readyLessons.length} lessons ready for release:`);
    readyLessons.forEach(lesson => {
      console.log(`   - Week ${lesson.week_number}: ${lesson.title} (Release: ${lesson.release_date})`);
    });

    // Release the lessons
    const { data: updatedLessons, error: updateError } = await supabase
      .from('lessons')
      .update({ 
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('published', true)
      .eq('is_published', false)
      .lte('release_date', new Date().toISOString().split('T')[0])
      .select('id, title, week_number');

    if (updateError) {
      console.error('❌ Error releasing lessons:', updateError);
      return;
    }

    console.log(`🎉 Successfully released ${updatedLessons.length} lessons!`);
    updatedLessons.forEach(lesson => {
      console.log(`   ✅ Released: Week ${lesson.week_number} - ${lesson.title}`);
    });

    // Summary statistics
    const { data: totalStats } = await supabase
      .from('lessons')
      .select('is_published')
      .eq('published', true);

    const published = totalStats?.filter(l => l.is_published).length || 0;
    const unpublished = totalStats?.filter(l => !l.is_published).length || 0;

    console.log('\n📊 Current Status:');
    console.log(`   📖 Published lessons: ${published}`);
    console.log(`   ⏳ Scheduled lessons: ${unpublished}`);
    console.log('✅ Auto-release process completed!');

  } catch (error) {
    console.error('💥 Auto-release script error:', error);
  }
}

// Run the auto-release
autoReleaseLessons();

// Export for use in other scripts
export { autoReleaseLessons };