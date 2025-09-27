'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { loadLessonProgress, saveLessonSession, clearLessonSession } from '@/lib/auth'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Multi-language Warmer Questions Component
interface MultiWarmerComponentProps {
  questions: string[];
  onComplete: () => void;
  isMultiLanguage: boolean;
  showTranslations: boolean;
}

function MultiWarmerComponent({ questions, onComplete, isMultiLanguage, showTranslations }: MultiWarmerComponentProps) {
  const parseMultiLanguageText = (text: string) => {
    if (!isMultiLanguage) return { english: text, translation: '' };
    const match = text.match(/^\[(.+?)\]-\[(.+?)\]$/);
    return {
      english: match?.[1] || text,
      translation: match?.[2] || ''
    };
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-800">Think about these questions before reading:</p>
      <div className="space-y-3">
        {questions.map((question, index) => {
          const parsed = parseMultiLanguageText(question);
          return (
            <div key={index} className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-900 font-medium">{index + 1}. {parsed.english}</p>
              {isMultiLanguage && showTranslations && parsed.translation && (
                <p className="text-blue-700 text-sm mt-1 italic">{parsed.translation}</p>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={onComplete}
        className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full text-center mx-auto block"
      >
        Continue to Vocabulary →
      </button>
    </div>
  );
}

// Multi-language Vocabulary Component - FIXED VERSION
interface MultiVocabularyComponentProps {
  vocabulary: string[];
  onComplete: () => void;
  isMultiLanguage: boolean;
  showTranslations: boolean;
}

function MultiVocabularyComponent({ vocabulary, onComplete, isMultiLanguage, showTranslations }: MultiVocabularyComponentProps) {
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [matches, setMatches] = useState<{[key: number]: number}>({});
  const [showResults, setShowResults] = useState(false);

  const parseVocabularyItem = (item: string) => {
    if (!isMultiLanguage) {
      // ESL format: word-definition
      const [word, definition] = item.split('-').map(part => part.trim());
      return { word: word || item, definition: definition || 'No definition' };
    }
    
    // CLIL format: [word]-[translation] / [definition]-[def_translation]
    const parts = item.split(' / ');
    
    if (parts.length >= 2) {
      // Full format: [word]-[word_translation] / [definition]-[def_translation]
      const wordPart = parts[0] || '';      // [defense]-[obrana]
      const defPart = parts[1] || '';       // [protection from danger]-[ochrana před nebezpečím]
      
      const wordMatch = wordPart.match(/^\[(.+?)\]-\[(.+?)\]$/);
      const defMatch = defPart.match(/^\[(.+?)\]-\[(.+?)\]$/);
      
      return {
        word: wordMatch?.[1] || wordPart,                    // "defense"
        wordTranslation: wordMatch?.[2] || '',               // "obrana"
        definition: defMatch?.[1] || defPart,                // "protection from danger"
        definitionTranslation: defMatch?.[2] || ''           // "ochrana před nebezpečím"
      };
    } else {
      // Simple format: just [word]-[translation] (no separate definition)
      const wordMatch = item.match(/^\[(.+?)\]-\[(.+?)\]$/);
      const word = wordMatch?.[1] || item;
      const translation = wordMatch?.[2] || '';
      
      return {
        word: word,                                          // "defense"
        wordTranslation: translation,                        // "obrana"
        definition: word,                                    // "defense" (same as word)
        definitionTranslation: translation                   // "obrana" (same as translation)
      };
    }
  };

  const vocabPairs = vocabulary.map((item, index) => ({
    index,
    ...parseVocabularyItem(item)
  }));

  // Create separate arrays for words and definitions
  const words = vocabPairs.map(pair => ({
    text: pair.word,              // Just the word part: "defense"
    translation: pair.wordTranslation, // Just the word translation: "obrana"
    index: pair.index
  }));

  const [definitions] = useState(() => {
    const defs = vocabPairs.map(pair => ({
      text: pair.definition,        // Just the definition part: "protection from danger"
      translation: pair.definitionTranslation, // Just the definition translation: "ochrana před nebezpečím"
      correctIndex: pair.index
    }));
    return defs.sort(() => Math.random() - 0.5); // Shuffle definitions only
  });

  const handleWordClick = (wordIndex: number) => {
    if (!showResults && !matches[wordIndex]) {
      setSelectedWord(wordIndex);
    }
  };

  const handleDefinitionClick = (correctIndex: number) => {
    if (selectedWord !== null && !showResults) {
      setMatches(prev => ({
        ...prev,
        [selectedWord]: correctIndex
      }));
      setSelectedWord(null);
    }
  };

  const submitMatches = () => {
    setShowResults(true);
  };

  const getScore = () => {
    const correct = Object.entries(matches).filter(([wordIdx, defIdx]) => 
      parseInt(wordIdx) === defIdx
    ).length;
    return { correct, total: vocabPairs.length };
  };

  const allMatched = vocabPairs.every((_, index) => matches[index] !== undefined);

// ADD THIS FUNCTION HERE
const removeMatch = (wordIndex: number) => {
  setMatches(prev => {
    const newMatches = { ...prev };
    delete newMatches[wordIndex];
    return newMatches;
  });
  setSelectedWord(null);
};


  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 font-medium">Instructions:</p>
        <p className="text-blue-700 text-sm mt-1">
          1. Click a word to select it (it will turn blue)
          <br />
          2. Then click its matching definition
          <br />
          3. Repeat for all words
        </p>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Words</h3>
          <div className="space-y-3">
            {words.map((word, index) => (
              <button
  key={index}
  onClick={() => handleWordClick(index)}
  disabled={showResults}
  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
    selectedWord === index
      ? 'border-blue-500 bg-blue-100'
      : matches[index] !== undefined
      ? showResults && matches[index] === index
        ? 'border-green-500 bg-green-50'
        : showResults
        ? 'border-red-500 bg-red-50'
        : 'border-purple-500 bg-purple-50'
      : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
  } disabled:cursor-not-allowed`}
>
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <div className="font-medium text-gray-900">{word.text}</div>
      {isMultiLanguage && showTranslations && word.translation && (
        <div className="text-sm text-800 italic">{word.translation}</div>
      )}
      {matches[index] !== undefined && (
        <div className="text-sm text-gray-800 mt-1">✓ Matched</div>
      )}
    </div>
    {matches[index] !== undefined && !showResults && (
      <span
        onClick={(e) => {
          e.stopPropagation();
          removeMatch(index);
        }}
        className="text-red-600 hover:text-red-800 ml-2 p-1 text-xl"
        title="Remove match"
      >
        ↶
      </span>
    )}
  </div>
</button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Definitions</h3>
          <div className="space-y-3">
            {definitions.map((defItem, index) => {
              const isUsed = Object.values(matches).includes(defItem.correctIndex);
              return (
                <button
                  key={index}
                  onClick={() => handleDefinitionClick(defItem.correctIndex)}
                  disabled={showResults || isUsed}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    isUsed
                      ? 'border-gray-200 bg-gray-100 text-gray-400'
                      : selectedWord !== null
                      ? 'border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  } disabled:cursor-not-allowed`}
                >
                  <div>{defItem.text}</div>
                  {isMultiLanguage && showTranslations && defItem.translation && (
                    <div className="text-sm text-gray-900 italic mt-1">{defItem.translation}</div>
                  )}
                  {isUsed && <span className="ml-2">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedWord !== null && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            You selected: <strong>{words[selectedWord].text}</strong>
            {isMultiLanguage && words[selectedWord].translation && (
              <span className="text-sm italic"> ({words[selectedWord].translation})</span>
            )}
            <br />
            <span className="text-sm">Now click its matching definition →</span>
          </p>
        </div>
      )}

      {!showResults ? (
        <button
          onClick={submitMatches}
          disabled={!allMatched}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 w-full text-center mx-auto block"
        >
          Check Matches ({Object.keys(matches).length}/{vocabPairs.length})
        </button>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-medium">
              Score: {getScore().correct}/{getScore().total} correct matches
            </p>
          </div>

          {/* Detailed Feedback for Incorrect Answers */}
          {getScore().correct < getScore().total && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-3">Incorrect Matches - Here are the correct answers:</h4>
              <div className="space-y-2">
                {Object.entries(matches)
                  .filter(([wordIdx, defIdx]) => parseInt(wordIdx) !== defIdx)
                  .map(([wordIdx, chosenDefIdx]) => {
                    const wordIndex = parseInt(wordIdx);
                    const correctDef = vocabPairs[wordIndex].definition;
                    const chosenDef = vocabPairs[chosenDefIdx]?.definition || 'Unknown';
                    return (
                      <div key={wordIdx} className="text-sm">
                        <span className="font-medium text-red-900">{vocabPairs[wordIndex].word}</span>
                        {isMultiLanguage && vocabPairs[wordIndex].wordTranslation && (
                          <span className="text-red-700"> ({vocabPairs[wordIndex].wordTranslation})</span>
                        )}
                        <br />
                        <span className="text-red-700">You chose: "{chosenDef}"</span>
                        <br />
                        <span className="text-green-700">Correct answer: "{correctDef}"</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Perfect Score Celebration */}
          {getScore().correct === getScore().total && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">🎉 Perfect! All matches correct!</p>
            </div>
          )}

          <button
            onClick={onComplete}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
            Continue to Reading →
          </button>
        </div>
      )}
    </div>
  );
}

// Multi-language Reading Component
interface MultiReadingComponentProps {
  readingText: string;
  onComplete: () => void;
  isMultiLanguage: boolean;
  showTranslations: boolean;
}

function MultiReadingComponent({ readingText, onComplete, isMultiLanguage, showTranslations }: MultiReadingComponentProps) {
  
  const parseReadingText = (text: string) => {
    if (!isMultiLanguage) {
      return text.split('\n').filter(p => p.trim()).map(paragraph => ({
        english: paragraph,
        translation: ''
      }));
    }

    // Split by sentence pairs [English]-[Translation]
    const sentences: Array<{english: string, translation: string}> = [];
    const matches = text.match(/\[([^\]]+)\]-\[([^\]]+)\]/g);
    
    if (matches) {
      matches.forEach(match => {
        const parsed = match.match(/\[([^\]]+)\]-\[([^\]]+)\]/);
        if (parsed) {
          sentences.push({
            english: parsed[1],
            translation: parsed[2]
          });
        }
      });
    }

    return sentences;
  };

  const parsedText = parseReadingText(readingText);

  return (
    <div className="space-y-4">
      
      <div className="prose max-w-none">
  {parsedText.map((sentence, index) => {
    // Check if this sentence is the source attribution
    const isSourceAttribution = sentence.english.trim().startsWith("This text is adapted from");
    
    return (
      <div key={index} className="mb-4">
        <p className={`leading-relaxed mb-1 ${
          isSourceAttribution 
            ? 'text-sm text-gray-800 italic border-t pt-3 mt-4' 
            : 'text-gray-800'
        }`}>
          {sentence.english}
        </p>
        {isMultiLanguage && showTranslations && sentence.translation && !isSourceAttribution && (
          <p className="text-gray-800 text-sm italic leading-relaxed">
            {sentence.translation}
          </p>
        )}
      </div>
    );
  })}
</div>

      <button
        onClick={onComplete}
        className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full text-center mx-auto block"
      >
        Continue to Questions →
      </button>
    </div>
  );
}

// Multi-language True/False Component
interface MultiTrueFalseComponentProps {
  questions: Array<{question: string, answer: boolean}>;
  onComplete: () => void;
  isMultiLanguage: boolean;
  showTranslations: boolean;
}

function MultiTrueFalseComponent({ questions, onComplete, isMultiLanguage, showTranslations }: MultiTrueFalseComponentProps) {
  const [answers, setAnswers] = useState<{[key: number]: boolean | null}>({});
  const [showResults, setShowResults] = useState(false);

  const parseQuestion = (questionText: string) => {
    if (!isMultiLanguage) return { english: questionText, translation: '' };
    
    // Format: [English]-[Translation] (TRUE/FALSE)
    const match = questionText.match(/^\[(.+?)\]-\[(.+?)\](.*)$/);
    return {
      english: match?.[1] || questionText,
      translation: match?.[2] || ''
    };
  };

  const handleAnswer = (questionIndex: number, answer: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitAnswers = () => {
    setShowResults(true);
  };

  const getScore = () => {
    const correct = questions.filter((q, index) => answers[index] === q.answer).length;
    return { correct, total: questions.length };
  };

  const allAnswered = questions.length > 0 && questions.every((_, index) => answers[index] !== undefined);

  return (
    <div className="space-y-4">
      <p className="text-gray-800">Are these statements true or false?</p>
      <div className="space-y-4">
        {questions.map((item, index) => {
          const parsed = parseQuestion(item.question);
          return (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="mb-3">
                <p className="text-gray-800">{parsed.english}</p>
                {isMultiLanguage && showTranslations && parsed.translation && (
                  <p className="text-gray-800 text-sm italic mt-1">{parsed.translation}</p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleAnswer(index, true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    answers[index] === true
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  True
                </button>
                <button
                  onClick={() => handleAnswer(index, false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    answers[index] === false
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  False
                </button>
              </div>
              
              {showResults && (
                <div className={`mt-3 p-3 rounded-lg ${
                  answers[index] === item.answer ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {answers[index] === item.answer ? '✅ Correct!' : `❌ Incorrect. The answer is ${item.answer ? 'TRUE' : 'FALSE'}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showResults ? (
        <button
          onClick={submitAnswers}
  disabled={!allAnswered}
  className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full text-center mx-auto block"
>
  Check Answers
        </button>
      ) : (
        <div className="mt-6">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">
              Score: {getScore().correct}/{getScore().total} correct
            </p>
          </div>
          <button
            onClick={onComplete}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
            Continue to Next Exercise →
          </button>
        </div>
      )}
    </div>
  );
}

// Sequence Process Component
interface SequenceProcessComponentProps {
  sequenceContent: string[] | undefined;
  sequenceInstructions: string | undefined;  // ADD THIS - separate instructions
  onComplete: () => void;
  isMultiLanguage: boolean;
  showTranslations: boolean;
}

function SequenceProcessComponent({ sequenceContent, sequenceInstructions, onComplete, isMultiLanguage, showTranslations }: SequenceProcessComponentProps) {
  const [userOrder, setUserOrder] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Simplified parsing - your parser already separates instructions and steps
  const parseSequenceContent = (steps: string[] | undefined, instructions: string | undefined) => {
    console.log('Sequence steps received:', steps);
    console.log('Sequence instructions received:', instructions);
    
    // Safety check for undefined or empty content
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return {
        instructions: instructions || 'Put the steps in the correct order',
        steps: []
      };
    }

    return {
      instructions: instructions || 'Put the steps in the correct order',
      steps: steps // Your parser already provides clean step array
    };
  };

  const parseStep = (step: string) => {
    if (!isMultiLanguage) return { english: step, translation: '' };
    
    // Handle multi-language format: [English]-[Translation]
    const match = step.match(/^\[(.+?)\]-\[(.+?)\]$/);
    return {
      english: match?.[1] || step,
      translation: match?.[2] || ''
    };
  };

const parseInstructions = (instructions: string) => {
  if (!isMultiLanguage || !instructions) return { english: instructions || 'Put the steps in the correct order', translation: '' };
  
  // Handle multi-language format: [English]-[Translation]
  const match = instructions.match(/^\[(.+?)\]-\[(.+?)\]$/);
  return {
    english: match?.[1] || instructions,
    translation: match?.[2] || ''
  };
};

  const { instructions, steps: sequenceSteps } = parseSequenceContent(sequenceContent, sequenceInstructions);

  // Parse and shuffle steps initially
  const [shuffledSteps] = useState(() => {
    if (sequenceSteps.length === 0) {
      return [];
    }

    const steps = sequenceSteps.map((step, index) => ({
      id: index,
      originalIndex: index,
      ...parseStep(step)
    }));
    return steps.sort(() => Math.random() - 0.5);
  });

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedItem === null) return;

    const newOrder = [...userOrder];
    const draggedStepId = shuffledSteps[draggedItem].id;
    
    // Remove item from current position if it exists
    const existingIndex = newOrder.indexOf(draggedStepId);
    if (existingIndex !== -1) {
      newOrder.splice(existingIndex, 1);
    }
    
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedStepId);
    setUserOrder(newOrder);
    setDraggedItem(null);
  };

  const addToSequence = (stepId: number) => {
    if (!userOrder.includes(stepId)) {
      setUserOrder([...userOrder, stepId]);
    }
  };

  const removeFromSequence = (index: number) => {
    const newOrder = [...userOrder];
    newOrder.splice(index, 1);
    setUserOrder(newOrder);
  };

  const submitSequence = () => {
    setShowResults(true);
  };

  const getScore = () => {
    const correct = userOrder.filter((stepId, index) => stepId === index).length;
    return { correct, total: sequenceSteps.length };
  };

  const isComplete = userOrder.length === sequenceSteps.length && sequenceSteps.length > 0;

  // Show error state if no content available
  if (!sequenceContent || !Array.isArray(sequenceContent) || sequenceSteps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 font-medium">No sequence content available</p>
          <p className="text-yellow-700 text-sm mt-1">
            This lesson may not have sequence exercises configured.
          </p>
        </div>
        <button
          onClick={onComplete}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
          Continue to Next Exercise →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 font-medium">Instructions:</p>
        <p className="text-blue-700 text-sm mt-1">
          Drag the steps into the correct order described below. You can also click steps to add them to your sequence.
        </p>
       <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
  {(() => {
    const parsedInstructions = parseInstructions(instructions);
    return (
      <div>
        <p className="text-yellow-800 font-medium text-sm">
          {parsedInstructions.english}
        </p>
        {isMultiLanguage && showTranslations && parsedInstructions.translation && (
          <p className="text-yellow-700 text-sm italic mt-1">
            {parsedInstructions.translation}
          </p>
        )}
      </div>
    );
  })()}
</div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Available Steps */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Available Steps</h3>
          <div className="space-y-3">
            {shuffledSteps.map((step, index) => {
              const isUsed = userOrder.includes(step.id);
               return (
                <div
                  key={step.id}
                  draggable={!showResults && !isUsed}
                  onDragStart={() => handleDragStart(index)}
                  onClick={() => !showResults && addToSequence(step.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isUsed
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : showResults
                      ? 'border-gray-300 bg-white'
                      : 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100'
                  } ${draggedItem === index ? 'opacity-50' : ''}`}
                >
                  <div className="font-medium">{step.english}</div>
                  {isMultiLanguage && showTranslations && step.translation && (
                    <div className="text-sm text-gray-800 italic mt-1">{step.translation}</div>
                  )}
                  {isUsed && <div className="text-xs text-gray-700 mt-1">✓ Used</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* User's Sequence */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Your Sequence</h3>
          <div className="space-y-3 min-h-[300px]">
            {userOrder.map((stepId, index) => {
              const step = shuffledSteps.find(s => s.id === stepId);
              if (!step) return null;
              
              const isCorrect = showResults && stepId === index;
              const isWrong = showResults && stepId !== index;
              
              return (
                <div
                  key={`sequence-${stepId}`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isCorrect
                      ? 'border-green-500 bg-green-50'
                      : isWrong
                      ? 'border-red-500 bg-red-50'
                      : 'border-purple-300 bg-purple-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium">{step.english}</div>
                          {isMultiLanguage && step.translation && (
                            <div className="text-sm text-gray-800 italic">{step.translation}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    {!showResults && (
                      <button
                        onClick={() => removeFromSequence(index)}
                        className="text-red-600 hover:text-red-800 ml-2 text-xl"
>
  ↶
                      </button>
                    )}
                  </div>
                  {showResults && (
                    <div className="mt-2 text-sm">
                      {isCorrect ? (
                        <span className="text-green-700">✅ Correct position</span>
                      ) : (
                        <span className="text-red-700">❌ Should be step {stepId + 1}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Drop zone for empty sequence */}
            {userOrder.length === 0 && !showResults && (
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(0)}
                className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-700"
              >
                Drag steps here or click steps to add them
              </div>
            )}
          </div>
        </div>
      </div>

      {!showResults ? (
        <button
          onClick={submitSequence}
          disabled={!isComplete}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 w-full text-center mx-auto block"
        >
          Check Order ({userOrder.length}/{sequenceSteps.length})
        </button>
      ) : (
        <div className="mt-6">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">
              Score: {getScore().correct}/{getScore().total} correct positions
            </p>
          </div>
          <button
            onClick={onComplete}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
            Continue to Next Exercise →
          </button>
        </div>
      )}
    </div>
  );
}

// Vocabulary Practice Component
interface VocabularyPracticeComponentProps {
  vocabularyPractice: Array<{sentence: string, answer: string}>;
  onComplete: () => void;
  isMultiLanguage: boolean;
  showTranslations: boolean;
  isLastExercise?: boolean;

}

function VocabularyPracticeComponent({ vocabularyPractice, onComplete, isMultiLanguage, showTranslations, isLastExercise = false }: VocabularyPracticeComponentProps) {
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [showResults, setShowResults] = useState(false);

  const parsePracticeItem = (item: {sentence: string, answer: string}) => {
    if (!isMultiLanguage) {
      return {
        englishSentence: item.sentence,
        translationSentence: '',
        answer: item.answer
      };
    }
    
    // Format: [English sentence]-[Translation sentence] (answer)
    const match = item.sentence.match(/^\[(.+?)\]-\[(.+?)\]$/);
    return {
      englishSentence: match?.[1] || item.sentence,
      translationSentence: match?.[2] || '',
      answer: item.answer
    };
  };

  // Get all unique answers for word bank
  const wordBank = [...new Set(vocabularyPractice.map(item => item.answer))];
  const [shuffledWordBank] = useState(() => [...wordBank].sort(() => Math.random() - 0.5));

  const handleAnswer = (questionIndex: number, selectedWord: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedWord
    }));
  };

  const submitAnswers = () => {
    setShowResults(true);
  };

  const getScore = () => {
    const correct = vocabularyPractice.filter((item, index) => 
      answers[index]?.toLowerCase() === item.answer.toLowerCase()
    ).length;
    return { correct, total: vocabularyPractice.length };
  };

  const allAnswered = vocabularyPractice.every((_, index) => answers[index]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 font-medium">Instructions:</p>
        <p className="text-blue-700 text-sm mt-1">
          Complete each sentence by clicking the correct word from the word bank below.
        </p>
      </div>

      {/* Word Bank */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Word Bank:</h4>
        <div className="flex flex-wrap gap-2">
          {shuffledWordBank.map((word, index) => {
            const timesUsed = Object.values(answers).filter(answer => answer === word).length;
            const timesNeeded = vocabularyPractice.filter(item => item.answer === word).length;
            const isExhausted = timesUsed >= timesNeeded;
            
            return (
              <span
                key={index}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  isExhausted && showResults
                    ? 'bg-gray-300 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {word} {timesUsed > 0 && `(${timesUsed}/${timesNeeded})`}
              </span>
            );
          })}
        </div>
      </div>

      {/* Practice Questions */}
      <div className="space-y-6">
        {vocabularyPractice.map((item, index) => {
          const parsed = parsePracticeItem(item);
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Question {index + 1}:
                </h4>
                <div className="space-y-2">
                  <p className="text-lg text-gray-800">
  {parsed.englishSentence.replace('_____', 
    answers[index] 
      ? `___${answers[index]}___`
      : '_____'
  )}
</p>
{isMultiLanguage && showTranslations && parsed.translationSentence && (
  <p className="text-gray-800 italic">
    {parsed.translationSentence}
  </p>
)}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-800 mb-2">Choose the correct word:</p>
                <div className="flex flex-wrap gap-2">
                  {shuffledWordBank.map((word, wordIndex) => {
                    const isSelected = answers[index] === word;
                    const isCorrect = showResults && word.toLowerCase() === item.answer.toLowerCase();
                    const isWrong = showResults && isSelected && !isCorrect;
                    
                    return (
                      <button
                        key={wordIndex}
                        onClick={() => handleAnswer(index, word)}
                        disabled={showResults}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isCorrect && showResults
                            ? 'bg-green-500 text-white'
                            : isWrong
                            ? 'bg-red-500 text-white'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-blue-200'
                        } disabled:cursor-not-allowed`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>

              {answers[index] && (
                <div className="mt-3">
                  <p className="text-sm text-gray-800">
                    Your answer: <span className="font-medium">{answers[index]}</span>
                  </p>
                  {showResults && (
                    <p className={`text-sm mt-1 ${
                      answers[index].toLowerCase() === item.answer.toLowerCase()
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}>
                      {answers[index].toLowerCase() === item.answer.toLowerCase()
                        ? '✅ Correct!'
                        : `❌ Incorrect. The correct answer is "${item.answer}"`
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showResults ? (
        <button
          onClick={submitAnswers}
          disabled={!allAnswered}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 w-full text-center mx-auto block"
        >
          Check Answers ({Object.keys(answers).length}/{vocabularyPractice.length})
        </button>
      ) : (
        <div className="mt-6">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">
              Score: {getScore().correct}/{getScore().total} correct
            </p>
          </div>
          <button
            onClick={onComplete}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
            {isLastExercise ? 'Continue to Summary →' : 'Continue to Next Exercise →'}
          </button>
        </div>
      )}
    </div>
  );
}

// Existing ESL components (TrueFalseComponent, FindInTextComponent, GrammarFocusComponent)
interface TrueFalseComponentProps {
  questions: Array<{question: string, answer: boolean}>;
  onComplete: () => void;
}

function TrueFalseComponent({ questions, onComplete }: TrueFalseComponentProps) {
  const [answers, setAnswers] = useState<{[key: number]: boolean | null}>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionIndex: number, answer: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitAnswers = () => {
    setShowResults(true);
  };

  const getScore = () => {
    const correct = questions.filter((q, index) => answers[index] === q.answer).length;
    return { correct, total: questions.length };
  };

  const allAnswered = questions.length > 0 && questions.every((_, index) => answers[index] !== undefined);

  return (
    <div className="space-y-4">
      <p className="text-gray-800">Are these statements true or false?</p>
      <div className="space-y-4">
        {questions.map((item, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <p className="text-gray-800 mb-3">{item.question}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleAnswer(index, true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  answers[index] === true
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                True
              </button>
              <button
                onClick={() => handleAnswer(index, false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  answers[index] === false
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                False
              </button>
            </div>
            
            {showResults && (
              <div className={`mt-3 p-3 rounded-lg ${
                answers[index] === item.answer ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {answers[index] === item.answer ? '✅ Correct!' : `❌ Incorrect. The answer is ${item.answer ? 'TRUE' : 'FALSE'}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {!showResults ? (
        <button
          onClick={submitAnswers}
          disabled={!allAnswered}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
          Check Answers
        </button>
      ) : (
        <div className="mt-6">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">
              Score: {getScore().correct}/{getScore().total} correct
            </p>
          </div>
          <button
            onClick={onComplete}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
            Continue to Next Exercise →
          </button>
        </div>
      )}
    </div>
  );
}

interface FindInTextComponentProps {
  findInText: Array<{clue: string, paragraph: number, answer: string}>;
  readingText: string;
  onComplete: () => void;
}

function FindInTextComponent({ findInText, readingText, onComplete }: FindInTextComponentProps) {
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [showParagraph, setShowParagraph] = useState<{[key: number]: boolean}>({});
  const [showResults, setShowResults] = useState(false);

  const paragraphs = readingText.split('\n').filter(p => p.trim());

  const handleAnswer = (questionIndex: number, selectedWord: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedWord
    }));
  };

  const submitAnswers = () => {
    setShowResults(true);
  };

  const getScore = () => {
    const correct = findInText.filter((item, index) => 
      answers[index]?.toLowerCase() === item.answer.toLowerCase()
    ).length;
    return { correct, total: findInText.length };
  };

  const allAnswered = findInText.every((_, index) => answers[index]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 font-medium">Instructions:</p>
        <p className="text-blue-700 text-sm mt-1">
          Find words in the text that match the given descriptions. Click "Show Paragraph" to see the text, then click the correct word.
        </p>
      </div>

      <div className="space-y-6">
        {findInText.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Question {index + 1}: Find the word that means "{item.clue}"
              </h4>
              
              <button
                onClick={() => setShowParagraph(prev => ({...prev, [index]: !prev[index]}))}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
              >
                {showParagraph[index] ? 'Hide' : 'Show'} Paragraph {item.paragraph}
              </button>
            </div>

            {showParagraph[index] && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800 leading-relaxed">
                  {paragraphs[item.paragraph - 1] || 'Paragraph not found'}
                </p>
              </div>
            )}

            {showParagraph[index] && (
              <div className="mb-4">
                <p className="text-sm text-gray-800 mb-2">Click the word that means "{item.clue}":</p>
                <div className="flex flex-wrap gap-2">
                  {paragraphs[item.paragraph - 1]?.split(' ').map((word, wordIndex) => {
                    const cleanWord = word.replace(/[.,!?;:]/g, '');
                    const isSelected = answers[index] === cleanWord;
                    const isCorrect = showResults && cleanWord.toLowerCase() === item.answer.toLowerCase();
                    const isWrong = showResults && isSelected && !isCorrect;
                    
                    return (
                      <button
                        key={wordIndex}
                        onClick={() => handleAnswer(index, cleanWord)}
                        disabled={showResults}
                        className={`px-2 py-1 rounded text-sm transition-colors ${
                          isCorrect && showResults
                            ? 'bg-green-500 text-white'
                            : isWrong
                            ? 'bg-red-500 text-white'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-blue-200'
                        } disabled:cursor-not-allowed`}
                      >
                        {cleanWord}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {answers[index] && (
              <div className="mt-3">
                <p className="text-sm text-gray-800">
                  Your answer: <span className="font-medium">{answers[index]}</span>
                </p>
                {showResults && (
                  <p className={`text-sm mt-1 ${
                    answers[index].toLowerCase() === item.answer.toLowerCase()
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {answers[index].toLowerCase() === item.answer.toLowerCase()
                      ? '✅ Correct!'
                      : `❌ Incorrect. The correct answer is "${item.answer}"`
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!showResults ? (
        <button
          onClick={submitAnswers}
          disabled={!allAnswered}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 w-full text-center mx-auto block"
        >
          Check Answers ({Object.keys(answers).length}/{findInText.length})
        </button>
      ) : (
        <div className="mt-6">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">
              Score: {getScore().correct}/{getScore().total} correct
            </p>
          </div>
          <button
            onClick={onComplete}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
            Continue to Next Exercise →
          </button>
        </div>
      )}
    </div>
  );
}

interface GrammarFocusComponentProps {
  grammarFocus: Array<{sentence: string, answer: string}>;
  onComplete: () => void;
  isLastExercise?: boolean;
}

function GrammarFocusComponent({ grammarFocus, onComplete, isLastExercise = false }: GrammarFocusComponentProps) {
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [showResults, setShowResults] = useState(false);

  const prepositionOptions = ['in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by', 'about', 'under', 'over', 'through', 'between', 'among', 'below', 'above', 'across', 'during', 'after', 'before'];

  const [shuffledOptions] = useState(() => {
    return grammarFocus.map(item => {
      const wrongOptions = prepositionOptions.filter(p => p !== item.answer).slice(0, 4);
      const allOptions = [item.answer, ...wrongOptions];
      return allOptions.sort(() => Math.random() - 0.5);
    });
  });

  const handleAnswer = (questionIndex: number, selectedPreposition: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedPreposition
    }));
  };

  const submitAnswers = () => {
    setShowResults(true);
  };

  const getScore = () => {
    const correct = grammarFocus.filter((item, index) => 
      answers[index]?.toLowerCase() === item.answer.toLowerCase()
    ).length;
    return { correct, total: grammarFocus.length };
  };

  const allAnswered = grammarFocus.every((_, index) => answers[index]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 font-medium">Instructions:</p>
        <p className="text-blue-700 text-sm mt-1">
          Complete each sentence by clicking the correct preposition for the blank space.
        </p>
      </div>

      <div className="space-y-6">
        {grammarFocus.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Question {index + 1}:
              </h4>
              <p className="text-lg text-gray-800">
                {item.sentence.replace('_____', 
                  answers[index] 
                    ? `___${answers[index]}___`
                    : '_____'
                )}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-800 mb-2">Choose the correct preposition:</p>
              <div className="flex flex-wrap gap-2">
                {shuffledOptions[index].map((option, optionIndex) => {
                  const isSelected = answers[index] === option;
                  const isCorrect = showResults && option.toLowerCase() === item.answer.toLowerCase();
                  const isWrong = showResults && isSelected && !isCorrect;
                  
                  return (
                    <button
                      key={optionIndex}
                      onClick={() => handleAnswer(index, option)}
                      disabled={showResults}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isCorrect && showResults
                          ? 'bg-green-500 text-white'
                          : isWrong
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-blue-200'
                      } disabled:cursor-not-allowed`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {answers[index] && (
              <div className="mt-3">
                <p className="text-sm text-gray-800">
                  Your answer: <span className="font-medium">{answers[index]}</span>
                </p>
                {showResults && (
                  <p className={`text-sm mt-1 ${
                    answers[index].toLowerCase() === item.answer.toLowerCase()
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {answers[index].toLowerCase() === item.answer.toLowerCase()
                      ? '✅ Correct!'
                      : `❌ Incorrect. The correct answer is "${item.answer}"`
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!showResults ? (
        <button
          onClick={submitAnswers}
          disabled={!allAnswered}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 w-full text-center mx-auto block"
        >
          Check Answers ({Object.keys(answers).length}/{grammarFocus.length})
        </button>
      ) : (
        <div className="mt-6">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">
              Score: {getScore().correct}/{getScore().total} correct
            </p>
          </div>
          <button
            onClick={onComplete}
            className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full text-center mx-auto block"
>
            {isLastExercise ? 'Continue to Summary →' : 'Continue to Next Exercise →'}
          </button>
        </div>
      )}
    </div>
  );
}

// Main Lesson Data Interface
interface LessonData {
  id: string;
  title: string;
  level: string;
  content_type: string;
  language_support: string;
  week_number: number;
  image_filename: string;
  content_data: {
    warmerQuestions: string[];
    vocabularyPreview: string[];
    readingText: string;
    trueFalse: Array<{question: string, answer: boolean}>;
    findInText?: Array<{clue: string, paragraph: number, answer: string}>;
    grammarFocus?: Array<{sentence: string, answer: string}>;
    sequenceProcess?: string[] | undefined;
    sequenceInstructions?: string | undefined;
    vocabularyPractice?: Array<{sentence: string, answer: string}>;
    summary: string;
  };
}

export default function LessonPage() {
  // Helper function for content type display
  const getContentTypeDisplay = (contentType: string) => {
    return {
      'esl': 'News Articles',
      'clil': 'Science Articles'  
    }[contentType] || contentType;
  };
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [exerciseProgress, setExerciseProgress] = useState<{[key: number]: boolean}>({});
  const [globalShowTranslations, setGlobalShowTranslations] = useState(false);

  // Determine if this is a multi-language lesson (CLIL with translation support)
  const isMultiLanguage = lesson?.content_type === 'clil' && lesson?.language_support !== 'English';
  const shouldShowTranslations = isMultiLanguage;

  const exercises = [
    { id: 0, name: 'Warm-up Questions', type: 'warmer' },
    { id: 1, name: 'Vocabulary Preview', type: 'vocabulary' },
    { id: 2, name: 'Reading', type: 'reading' },
    { id: 3, name: 'True/False', type: 'trueFalse' },
    ...(lesson?.content_data.findInText ? [{ id: 4, name: 'Find in Text', type: 'findInText' }] : []),
    ...(lesson?.content_data.grammarFocus ? [{ id: 5, name: 'Grammar Focus', type: 'grammarFocus' }] : []),
    ...(lesson?.content_data.sequenceProcess ? [{ id: 6, name: 'Process Steps', type: 'sequenceProcess' }] : []),
    ...(lesson?.content_data.vocabularyPractice ? [{ id: 7, name: 'Vocabulary Practice', type: 'vocabularyPractice' }] : []),
    { id: 8, name: 'Summary', type: 'summary' }
  ];

  // Auto-scroll to lesson content when changing exercises
const scrollToLessonContent = () => {
  // Small delay to ensure content has rendered
  setTimeout(() => {
    const lessonContentElement = document.querySelector('.lg\\:col-span-3 .bg-white');
    if (lessonContentElement) {
      const headerOffset = 100; // Account for header height
      const elementPosition = lessonContentElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, 100);
};

const isLastExerciseBeforeSummary = (currentIndex: number) => {
    const nextExercise = exercises[currentIndex + 1];
    return nextExercise?.type === 'summary';
  };

  useEffect(() => {
    fetchLesson();
  }, [params?.id]);

  // Load existing progress when lesson is loaded
  useEffect(() => {
    const loadExistingProgress = async () => {
      if (!lesson?.id) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const progress = await loadLessonProgress(user.id, lesson.id);
        if (progress && progress.current_exercise_index > 0) {
          setCurrentExercise(progress.current_exercise_index || 0);
          setExerciseProgress(progress.completed_exercises || {});
        }
      } catch (error) {
        console.error('Error loading lesson progress:', error);
        // On error, stay at exercise 0 (restart)
      }
    };

    if (lesson) {
      loadExistingProgress();
    }
  }, [lesson]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
        if (!params?.id) {
      router.push('/lessons');
      return;
    }
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', params.id)
        .eq('published', true)
        .single();

      if (error) {
        console.error('Error fetching lesson:', error);
        router.push('/lessons');
        return;
      }

      setLesson(data);
    } catch (error) {
      console.error('Fetch lesson error:', error);
      router.push('/lessons');
    } finally {
      setLoading(false);
    }
  };

  const markExerciseComplete = async (exerciseIndex: number) => {
    const newProgress = { ...exerciseProgress, [exerciseIndex]: true };
    setExerciseProgress(newProgress);
    
    // Save to database immediately
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && lesson) {
        await saveLessonSession(
          user.id, 
          lesson.id, 
          exerciseIndex + 1, // Next exercise index
          newProgress
        );
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      // Continue anyway - don't block user experience
    }
  };

  const getCompletedCount = () => {
    return Object.values(exerciseProgress).filter(Boolean).length;
  };

  const isLessonComplete = () => {
    return getCompletedCount() === exercises.length;
  };

  const saveLessonProgress = async () => {
    try {
      console.log('Saving lesson progress...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated');
        return;
      }

      // Calculate overall score (average of all exercise scores)
      let totalScore = 0;
      let exerciseCount = 0;
      
      // For now, we'll use a simple scoring system
      // In a real implementation, you'd track individual exercise scores
      const completedExercises = getCompletedCount();
      const overallScore = Math.round((completedExercises / exercises.length) * 100);
      
      console.log('Calculated score:', overallScore);

      // Save or update progress in database
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson?.id,
          is_completed: true,
          percentage_score: overallScore,
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving progress:', error);
      } else {
        console.log('Progress saved successfully:', data);
      }

      // Clear the session data since lesson is complete
      if (lesson) {
        await clearLessonSession(user.id, lesson.id);
      }
      
    } catch (error) {
      console.error('Save progress error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h1>
          <button
            onClick={() => router.push('/lessons')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

if (!lesson) {
    return <div className="p-8">Loading lesson...</div>;
  }

  if (!lesson.content_data) {
    return <div className="p-8">Lesson content not found...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/lessons')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Lessons
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isMultiLanguage ? 
                    lesson.title.match(/^\[(.+?)\]/)?.[1] || lesson.title : 
                    lesson.title
                  }
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-800 mt-1">
  <span className="capitalize">{lesson.level}</span>
  <span>•</span>
  <span>{getContentTypeDisplay(lesson.content_type)}</span>
  <span>•</span>
                  <span>Week {lesson.week_number}</span>
                  {isMultiLanguage && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{lesson.language_support} Support</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden sm:block text-right">
  <div className="text-sm text-gray-800">Progress</div>
  <div className="text-lg font-semibold text-blue-600">
    {getCompletedCount()}/{exercises.length}
  </div>
</div>
          </div>
          

          {/* Progress Bar */}
<div className="mt-4">
  <div className="flex items-center justify-between text-xs text-gray-800 mb-2">
    <span>Exercise Progress</span>
    <span>{getCompletedCount()}/{exercises.length} complete</span>
  </div>
  <div className="bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${(getCompletedCount() / exercises.length) * 100}%` }}
    ></div>
  </div>
</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Exercise Navigation Sidebar - HIDDEN ON MOBILE */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Lesson Exercises</h3>
              <nav className="space-y-2">
                {exercises.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      setCurrentExercise(index);
                      scrollToLessonContent();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentExercise === index
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : exerciseProgress[index]
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{exercise.name}</span>
                      {exerciseProgress[index] && <span className="text-green-600">✓</span>}
                    </div>
                  </button>
                ))}
              </nav>

              {isLessonComplete() && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎉</div>
                    <div className="font-semibold text-green-800 mb-2">
                      Lesson Complete!
                    </div>
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Continue Learning
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Exercise Content - FULL WIDTH ON MOBILE */}
          <div className="col-span-1 lg:col-span-3">
            {/* Mobile Exercise Navigation - COMPACT TOP BAR */}
            <div className="lg:hidden mb-4 bg-white rounded-lg shadow-sm p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {exercises[currentExercise]?.name}
                </h3>
                <span className="text-xs 700">
                  {currentExercise + 1}/{exercises.length}
                </span>
              </div>
              
              {/* Mobile Progress Dots */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-2">
                {exercises.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    onClick={() => {
                      setCurrentExercise(index);
                      scrollToLessonContent();
                    }}
                    className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                      currentExercise === index
                        ? 'bg-blue-600 text-white'
                        : exerciseProgress[index]
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {exerciseProgress[index] ? '✓' : index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-8">
              {/* Lesson Image */}
              <div className="mb-4 sm:mb-8">
                <img
                  src={`/images/lessons/${lesson.image_filename || 'placeholder'}.jpg`}
                  alt={lesson.title}
                  className="w-full h-40 sm:h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/images/lessons/placeholder.jpg';
                  }}
                />
              </div>
              {/* Global Translation Toggle */}
{isMultiLanguage && (
  <div className="mb-6 flex justify-end">
    <button
      onClick={() => setGlobalShowTranslations(!globalShowTranslations)}
      className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors font-medium"
    >
      {globalShowTranslations ? 'Hide Translations' : 'Show Translations'}
    </button>
  </div>
)}

              {/* Exercise Content */}
              <div>
                {/* Desktop Exercise Title - Hidden on Mobile since it's in top bar */}
                <h2 className="hidden lg:block text-xl font-semibold text-gray-900 mb-6">
                  {exercises[currentExercise]?.name}
                </h2>

                {/* Exercise Components */}
                {exercises[currentExercise]?.type === 'warmer' && (
                  <MultiWarmerComponent
                    questions={lesson.content_data.warmerQuestions}
                    isMultiLanguage={isMultiLanguage}
                    showTranslations={globalShowTranslations}
                    onComplete={async () => {
                      await markExerciseComplete(currentExercise);
                      setCurrentExercise(1);
                      scrollToLessonContent();
                    }}
                  />
                )}

                {exercises[currentExercise]?.type === 'vocabulary' && (
                  <MultiVocabularyComponent
                    vocabulary={lesson.content_data.vocabularyPreview}
                    isMultiLanguage={isMultiLanguage}
                    showTranslations={globalShowTranslations}
                    onComplete={async () => {
                      await markExerciseComplete(currentExercise);
                      setCurrentExercise(2);
                      scrollToLessonContent();
                    }}
                  />
                )}

                {exercises[currentExercise]?.type === 'reading' && (
                  <MultiReadingComponent
                    readingText={lesson.content_data.readingText}
                    isMultiLanguage={isMultiLanguage}
                    showTranslations={globalShowTranslations}
                    onComplete={async () => {
                      await markExerciseComplete(currentExercise);
                      setCurrentExercise(3);
                      scrollToLessonContent();
                    }}
                  />
                )}

                {exercises[currentExercise]?.type === 'trueFalse' && (
                  <>
                    {isMultiLanguage ? (
                      <MultiTrueFalseComponent
                        questions={lesson.content_data.trueFalse}
                        isMultiLanguage={isMultiLanguage}
                        showTranslations={globalShowTranslations}
                        onComplete={() => {
                          markExerciseComplete(currentExercise);
                          setCurrentExercise(currentExercise + 1);
                          scrollToLessonContent();
                        }}
                      />
                    ) : (
                      <TrueFalseComponent
                        questions={lesson.content_data.trueFalse}
                        onComplete={() => {
                          markExerciseComplete(currentExercise);
                          setCurrentExercise(currentExercise + 1);
                          scrollToLessonContent();
                        }}
                      />
                    )}
                  </>
                )}

                {exercises[currentExercise]?.type === 'findInText' && (
                  <FindInTextComponent
                    findInText={lesson.content_data.findInText || []}
                    readingText={lesson.content_data.readingText}
                    onComplete={async () => {
                      await markExerciseComplete(currentExercise);
                      setCurrentExercise(currentExercise + 1);
                      scrollToLessonContent();
                    }}
                  />
                )}

                {exercises[currentExercise]?.type === 'grammarFocus' && (
                  <GrammarFocusComponent
                    grammarFocus={lesson.content_data.grammarFocus || []}
                    isLastExercise={isLastExerciseBeforeSummary(currentExercise)}
                    onComplete={async () => {
                      await markExerciseComplete(currentExercise);
                      setCurrentExercise(currentExercise + 1);
                      scrollToLessonContent();
                    }}
                  />
                )}

                {exercises[currentExercise]?.type === 'sequenceProcess' && (
                  <SequenceProcessComponent
                    sequenceContent={lesson?.content_data?.sequenceProcess}
                    sequenceInstructions={lesson?.content_data?.sequenceInstructions}
                    isMultiLanguage={isMultiLanguage}
                    showTranslations={globalShowTranslations}
                    onComplete={async () => {
                      await markExerciseComplete(currentExercise);
                      setCurrentExercise(currentExercise + 1);
                      scrollToLessonContent();
                    }}
                  />
                )}

                {exercises[currentExercise]?.type === 'vocabularyPractice' && (
                  <VocabularyPracticeComponent
                    vocabularyPractice={lesson.content_data.vocabularyPractice || []}
                    isMultiLanguage={isMultiLanguage}
                    showTranslations={globalShowTranslations}
                    isLastExercise={isLastExerciseBeforeSummary(currentExercise)}
                    onComplete={async () => {
                      await markExerciseComplete(currentExercise);
                      setCurrentExercise(currentExercise + 1);
                      scrollToLessonContent();
                    }}
                  />
                )}

                {exercises[currentExercise]?.type === 'summary' && (
                  <div className="space-y-4">
                    <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3">Lesson Summary</h3>
                      <p className="text-blue-800">
                        {isMultiLanguage ? 
                          lesson.content_data.summary.match(/^\[(.+?)\]/)?.[1] || lesson.content_data.summary :
                          lesson.content_data.summary
                        }
                      </p>
                      {isMultiLanguage && globalShowTranslations && lesson.content_data.summary.match(/^\[.+?\]-\[(.+?)\]$/)?.[1] && (
                        <p className="text-blue-700 text-sm italic mt-2">
                          {lesson.content_data.summary.match(/^\[.+?\]-\[(.+?)\]$/)?.[1]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        markExerciseComplete(currentExercise);
                        await saveLessonProgress();
                        
                        const urlParams = new URLSearchParams(window.location.search);
                        const isSample = urlParams.get('sample') === 'true';
                        
                        if (isSample) {
                          const level = urlParams.get('level') || 'beginner';
                          const content = urlParams.get('content') || 'esl';
                          const language = urlParams.get('language') || 'English';
                          
                          window.location.href = `/register?plan=${content}&level=${level}&language=${language}`;
                        } else {
                          window.location.href = '/dashboard';
                        }
                      }}
                      className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full text-center mx-auto block"
                    >
                      {new URLSearchParams(window.location.search).get('sample') === 'true' 
                        ? 'Get Full Access →' 
                        : 'Complete Lesson ✓'
                      }
                    </button>
                  </div>
                )}

                {/* Exercise Navigation */}
                <div className="flex justify-between mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setCurrentExercise(Math.max(0, currentExercise - 1));
                      scrollToLessonContent();
                    }}
                    disabled={currentExercise === 0}
                    className="px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs sm:text-sm text-gray-700 flex items-center">
                    {currentExercise + 1} of {exercises.length}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentExercise(Math.min(exercises.length - 1, currentExercise + 1));
                      scrollToLessonContent();
                    }}
                    disabled={currentExercise === exercises.length - 1}
                    className="px-2 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}