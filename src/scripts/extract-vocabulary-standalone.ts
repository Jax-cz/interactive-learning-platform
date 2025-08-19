// Create this as: src/scripts/extract-vocabulary-standalone.ts
// Standalone script with Supabase credentials

import { createClient } from '@supabase/supabase-js';

// ⚠️ REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://kwdaeigjtsxsnjnzlatt.supabase.co'; // Your Supabase URL from console logs
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZGFlaWdqdHN4c25qbnpsYXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTg1MywiZXhwIjoyMDY5NTU1ODUzfQ.jD-_yX_lZcFt4nQu3eWFEeJKOsg5BJMnu-k5VfceYwI'; // Get this from Supabase Dashboard

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Function to extract vocabulary from content_data
function extractVocabularyFromContent(contentData: any): any[] {
  try {
    // Check if contentData has vocabularyPreview
    if (contentData.vocabularyPreview) {
      const vocabData = contentData.vocabularyPreview;
      
      // Handle CLIL format: Array of "[word]-[translation] / [definition]-[definition translation]"
      if (Array.isArray(vocabData)) {
        const vocabulary = vocabData.map(item => {
          if (typeof item === 'string') {
            // Check if it's CLIL format with brackets and translations
            if (item.includes('[') && item.includes(']') && item.includes(' / ')) {
              // Format: "[defense]-[défense] / [protection against attack or danger]-[protection contre une attaque ou un danger]"
              const parts = item.split(' / ');
              if (parts.length >= 2) {
                // Extract word from first part: "[defense]-[défense]"
                const wordPart = parts[0].replace(/\[|\]/g, ''); // Remove brackets
                const word = wordPart.split('-')[0]?.trim();
                
                // Extract definition from second part: "[protection against attack or danger]-[...]"
                const definitionPart = parts[1].replace(/\[|\]/g, ''); // Remove brackets
                const definition = definitionPart.split('-')[0]?.trim();
                
                if (word && definition) {
                  return { word, definition };
                }
              }
            } else {
              // ESL format: "pilgrimage-a religious or spiritual journey"
              const [word, ...definitionParts] = item.split('-');
              const definition = definitionParts.join('-').trim(); // Rejoin in case definition has dashes
              if (word && definition) {
                return { word: word.trim(), definition };
              }
            }
          }
          return null;
        }).filter(Boolean);
        
        return vocabulary;
      }
    }
    
    // If no vocabulary found, return empty array
    return [];
  } catch (error) {
    console.error('Error extracting vocabulary:', error);
    return [];
  }
}

// Main function to update all lessons
async function updateAllLessonsWithVocabulary() {
  try {
    console.log('🚀 Starting vocabulary extraction for all lessons...');
    console.log('📡 Using Supabase URL:', SUPABASE_URL);
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('lessons')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Cannot connect to Supabase:', testError.message);
      console.log('💡 Make sure you updated the SUPABASE_ANON_KEY in the script!');
      return;
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Get all lessons
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title, content_data, vocabulary_data, content_type')
      .order('week_number', { ascending: true });
    
    if (fetchError) {
      console.error('Error fetching lessons:', fetchError);
      return;
    }
    
    console.log(`📚 Found ${lessons?.length || 0} lessons to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const sampleResults: any[] = [];
    
    for (const lesson of lessons || []) {
      try {
        // Skip if vocabulary_data already exists
        if (lesson.vocabulary_data && lesson.vocabulary_data.length > 0) {
          console.log(`⏭️  Skipping "${lesson.title}" - vocabulary already exists`);
          skippedCount++;
          continue;
        }
        
        // Extract vocabulary from content_data
        const vocabulary = extractVocabularyFromContent(lesson.content_data);
        
        if (vocabulary.length === 0) {
          console.log(`⚠️  No vocabulary found in "${lesson.title}" (${lesson.content_type})`);
          console.log(`   Content keys:`, Object.keys(lesson.content_data || {}));
          if (lesson.content_data?.vocabularyPreview) {
            console.log(`   Vocab preview sample:`, lesson.content_data.vocabularyPreview.slice(0, 1));
          }
          skippedCount++;
          continue;
        }
        
        // Update the lesson with vocabulary_data
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ vocabulary_data: vocabulary })
          .eq('id', lesson.id);
        
        if (updateError) {
          console.error(`❌ Error updating "${lesson.title}":`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Updated "${lesson.title}" (${lesson.content_type}) with ${vocabulary.length} vocabulary words`);
          
          // Store sample for testing
          if (sampleResults.length < 3) {
            sampleResults.push({
              title: lesson.title,
              content_type: lesson.content_type,
              vocabulary_count: vocabulary.length,
              sample_vocab: vocabulary.slice(0, 2) // First 2 words
            });
          }
          
          updatedCount++;
        }
        
        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing lesson "${lesson.title}":`, error);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Vocabulary extraction complete!');
    console.log(`✅ Updated: ${updatedCount} lessons`);
    console.log(`⏭️  Skipped: ${skippedCount} lessons`);
    console.log(`❌ Errors: ${errorCount} lessons`);
    
    // Show sample results
    if (sampleResults.length > 0) {
      console.log('\n📝 Sample vocabulary extraction results:');
      sampleResults.forEach(result => {
        console.log(`\n🔍 "${result.title}" (${result.content_type}):`);
        console.log(`   Vocabulary count: ${result.vocabulary_count}`);
        console.log(`   Sample words:`, result.sample_vocab);
      });
    }
    
    // Test the vocabulary review system
    console.log('\n🧪 Testing vocabulary review system...');
    const { data: testLessons, error: testError2 } = await supabase
      .from('lessons')
      .select('title, vocabulary_data, content_type')
      .not('vocabulary_data', 'is', null)
      .limit(3);
    
    if (testError2) {
      console.error('❌ Error testing vocabulary review:', testError2);
    } else if (testLessons && testLessons.length > 0) {
      console.log(`✅ Found ${testLessons.length} lessons with vocabulary data`);
      testLessons.forEach(lesson => {
        const vocabCount = Array.isArray(lesson.vocabulary_data) ? lesson.vocabulary_data.length : 0;
        console.log(`   "${lesson.title}" (${lesson.content_type}): ${vocabCount} words`);
      });
      console.log('\n🎯 Vocabulary review should now work on the dashboard!');
    } else {
      console.log('⚠️  No lessons found with vocabulary data after extraction');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during vocabulary extraction:', error);
  }
}

// Run the script
updateAllLessonsWithVocabulary();