// lib/auto-release.js
// Auto-release function for Vercel Cron (same logic as your working script)

import { createClient } from '@supabase/supabase-js';

export async function autoReleaseLessons() {
  try {
    console.log('🚀 Starting auto-release process...');
    
    // Use service role key (same as your working script)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get current date (same logic as your working script)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log('Current date:', todayString);

    // Check for lessons ready to release (exact same query)
    const { data: readyLessons, error: checkError } = await supabase
      .from('lessons')
      .select('id, title, week_number, release_date, is_published')
      .eq('published', true)
      .eq('is_published', false)
      .lte('release_date', todayString);

    if (checkError) {
      console.error('❌ Error checking lessons:', checkError);
      return { success: false, error: checkError.message };
    }

    if (!readyLessons || readyLessons.length === 0) {
      console.log('✅ No lessons ready for release today.');
      return { success: true, message: 'No lessons ready for release', count: 0 };
    }

    console.log(`📚 Found ${readyLessons.length} lessons ready for release:`);
    readyLessons.forEach(lesson => {
      console.log(`   - Week ${lesson.week_number}: ${lesson.title} (Release: ${lesson.release_date})`);
    });

    // Release the lessons (exact same update)
    const { data: updatedLessons, error: updateError } = await supabase
      .from('lessons')
      .update({ 
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('published', true)
      .eq('is_published', false)
      .lte('release_date', todayString)
      .select('id, title, week_number');

    if (updateError) {
      console.error('❌ Error releasing lessons:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`🎉 Successfully released ${updatedLessons.length} lessons!`);
    updatedLessons.forEach(lesson => {
      console.log(`   ✅ Released: Week ${lesson.week_number} - ${lesson.title}`);
    });

    // Summary statistics (same as your script)
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

    return { 
      success: true, 
      message: `Released ${updatedLessons.length} lessons`,
      count: updatedLessons.length,
      released: updatedLessons,
      stats: { published, unpublished }
    };

  } catch (error) {
    console.error('💥 Auto-release script error:', error);
    return { success: false, error: error.message };
  }
}