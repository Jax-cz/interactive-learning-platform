'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TranslationWorkflowTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sample English CLIL content (what you'd start with)
  const englishContent = {
    title: "Ocean Acidification",
    topic_category: "Environmental Science",
    intro: "The ocean is becoming more acidic due to increased carbon dioxide in the atmosphere. This process is called ocean acidification and it affects marine life.",
    vocabulary: [
      {
        word: "acidification",
        definition: "the process of becoming more acidic",
        example: "Ocean acidification is caused by CO2 absorption."
      },
      {
        word: "marine",
        definition: "relating to the sea or ocean",
        example: "Marine animals are affected by water temperature changes."
      },
      {
        word: "atmosphere",
        definition: "the layer of gases surrounding Earth",
        example: "Carbon dioxide in the atmosphere is increasing."
      }
    ],
    exercises: [
      {
        type: "vocabulary_matching",
        instructions: "Match each term with its definition",
        pairs: [
          { word: "acidification", definition: "the process of becoming more acidic" },
          { word: "marine", definition: "relating to the sea or ocean" },
          { word: "atmosphere", definition: "the layer of gases surrounding Earth" }
        ]
      }
    ]
  };

  // Simulated Claude translation (in real workflow, this would be Claude's response)
  const generateTranslations = (content: any, targetLanguage: string) => {
    const translations: any = {
      cs: { // Czech
        title: "Okyselování oceánů",
        intro_translation: "Oceán se stává kyselejším kvůli zvýšenému oxidu uhličitému v atmosféře. Tento proces se nazývá okyselování oceánů a ovlivňuje mořský život.",
        vocabulary: content.vocabulary.map((item: any) => ({
          ...item,
          czech: item.word === "acidification" ? "okyselování" :
                 item.word === "marine" ? "mořský" :
                 item.word === "atmosphere" ? "atmosféra" : item.word,
          definition_czech: item.word === "acidification" ? "proces stávání se kyselejším" :
                           item.word === "marine" ? "vztahující se k moři nebo oceánu" :
                           item.word === "atmosphere" ? "vrstva plynů obklopující Zemi" : item.definition,
          example_czech: item.word === "acidification" ? "Okyselování oceánů je způsobeno absorpcí CO2." :
                        item.word === "marine" ? "Mořská zvířata jsou ovlivněna změnami teploty vody." :
                        item.word === "atmosphere" ? "Oxid uhličitý v atmosféře se zvyšuje." : item.example
        })),
        exercises: content.exercises.map((ex: any) => ({
          ...ex,
          instructions_czech: "Přiřaďte každý termín k jeho definici"
        }))
      },
      de: { // German
        title: "Ozeanversauerung",
        intro_translation: "Der Ozean wird aufgrund von erhöhtem Kohlendioxid in der Atmosphäre saurer. Dieser Prozess wird Ozeanversauerung genannt und betrifft das Meeresleben.",
        vocabulary: content.vocabulary.map((item: any) => ({
          ...item,
          german: item.word === "acidification" ? "Versauerung" :
                  item.word === "marine" ? "Meeres-" :
                  item.word === "atmosphere" ? "Atmosphäre" : item.word,
          definition_german: item.word === "acidification" ? "der Prozess des Saurer-Werdens" :
                            item.word === "marine" ? "das Meer oder den Ozean betreffend" :
                            item.word === "atmosphere" ? "die Gasschicht um die Erde" : item.definition,
          example_german: item.word === "acidification" ? "Die Ozeanversauerung wird durch CO2-Absorption verursacht." :
                         item.word === "marine" ? "Meerestiere sind von Wassertemperaturänderungen betroffen." :
                         item.word === "atmosphere" ? "Kohlendioxid in der Atmosphäre nimmt zu." : item.example
        })),
        exercises: content.exercises.map((ex: any) => ({
          ...ex,
          instructions_german: "Ordnen Sie jeden Begriff seiner Definition zu"
        }))
      }
    };
    
    return translations[targetLanguage as keyof typeof translations];
  };

  const testTranslationWorkflow = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Create English master lesson
      const englishLesson = {
        title: englishContent.title,
        description: `CLIL lesson about ${englishContent.title.toLowerCase()}`,
        content_type: 'clil',
        level: 'intermediate',
        language: 'en',
        topic_category: englishContent.topic_category,
        week_number: 3,
        release_date: new Date().toISOString(),
        content: {
          intro: englishContent.intro,
          vocabulary: englishContent.vocabulary,
          exercises: englishContent.exercises
        },
        estimated_duration: 20,
        exercise_count: englishContent.exercises.length,
        is_published: false, // Draft until proofreader approves
        is_sample: true,
        slug: `ocean-acidification-intermediate-en`,
        tags: ['science', 'environment', 'chemistry', 'clil'],
        original_language: 'en'
      };

      const { data: masterLesson, error: masterError } = await supabase
        .from('lessons')
        .insert(englishLesson)
        .select()
        .single();

      if (masterError) throw masterError;

      // Step 2: Generate translations for Czech and German
      const czechTranslation = generateTranslations(englishContent, 'cs');
      const germanTranslation = generateTranslations(englishContent, 'de');

      // Step 3: Create Czech support version
      const czechLesson = {
        title: `${englishContent.title} (Czech Support)`,
        description: `CLIL lesson with Czech vocabulary support`,
        content_type: 'clil',
        level: 'intermediate',
        language: 'cs',
        topic_category: englishContent.topic_category,
        week_number: 3,
        release_date: new Date().toISOString(),
        content: {
          intro: englishContent.intro,
          intro_translation: czechTranslation.intro_translation,
          vocabulary: czechTranslation.vocabulary,
          exercises: czechTranslation.exercises
        },
        estimated_duration: 20,
        exercise_count: englishContent.exercises.length,
        is_published: false, // Awaiting proofreader approval
        is_sample: true,
        slug: `ocean-acidification-intermediate-cs`,
        tags: ['science', 'environment', 'chemistry', 'clil', 'czech'],
        parent_lesson_id: masterLesson.id,
        original_language: 'en'
      };

      const { error: czechError } = await supabase
        .from('lessons')
        .insert(czechLesson);

      if (czechError) throw czechError;

      // Step 4: Create German support version
      const germanLesson = {
        title: `${englishContent.title} (German Support)`,
        description: `CLIL lesson with German vocabulary support`,
        content_type: 'clil',
        level: 'intermediate',
        language: 'de',
        topic_category: englishContent.topic_category,
        week_number: 3,
        release_date: new Date().toISOString(),
        content: {
          intro: englishContent.intro,
          intro_translation: germanTranslation.intro_translation,
          vocabulary: germanTranslation.vocabulary,
          exercises: germanTranslation.exercises
        },
        estimated_duration: 20,
        exercise_count: englishContent.exercises.length,
        is_published: false, // Awaiting proofreader approval
        is_sample: true,
        slug: `ocean-acidification-intermediate-de`,
        tags: ['science', 'environment', 'chemistry', 'clil', 'german'],
        parent_lesson_id: masterLesson.id,
        original_language: 'en'
      };

      const { error: germanError } = await supabase
        .from('lessons')
        .insert(germanLesson);

      if (germanError) throw germanError;

      setResult(`✅ Translation workflow successful!
      
Created:
• English master lesson (ID: ${masterLesson.id})
• Czech support version (linked to master)
• German support version (linked to master)

All lessons created as drafts awaiting proofreader approval.

Workflow: English Content → Claude Translation → Database Storage → Ready for Proofreader Review`);

    } catch (err: any) {
      setError(`Translation workflow failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Translation Workflow Test
          </h1>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Sample English CLIL Content
              </h2>
              <div className="space-y-3 text-sm">
                <p><strong>Title:</strong> {englishContent.title}</p>
                <p><strong>Topic:</strong> {englishContent.topic_category}</p>
                <p><strong>Vocabulary:</strong> {englishContent.vocabulary.length} terms</p>
                <p><strong>Exercises:</strong> {englishContent.exercises.length} activities</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Translation Workflow Steps
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Create English master lesson in database</li>
                <li>Generate Czech and German translations using Claude</li>
                <li>Create Czech support version (linked to master)</li>
                <li>Create German support version (linked to master)</li>
                <li>Mark all as drafts awaiting proofreader review</li>
              </ol>
            </div>

            <div className="text-center">
              <button
                onClick={testTranslationWorkflow}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing Workflow...' : 'Test Translation Workflow'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold">Workflow Error:</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold">Workflow Result:</h3>
                <pre className="text-green-600 mt-2 text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}

            <div className="text-center">
              <a 
                href="/"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}