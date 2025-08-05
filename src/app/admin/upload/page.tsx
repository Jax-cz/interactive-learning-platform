'use client';

import { useState } from 'react';

interface ParsedLesson {
  title: string;
  level: string;
  contentType: string;
  languageSupport: string;
  weekNumber: number;
  imageFilename: string;
  sections: {
    warmerQuestions: string[];
    vocabularyPreview: string[];
    readingText: string;
    trueFalse: Array<{question: string, answer: boolean}>;
    findInText?: Array<{clue: string, paragraph: number, answer: string}>;
    grammarFocus?: Array<{sentence: string, answer: string}>;
    sequenceProcess?: string[];
    sequenceInstructions?: string;
    vocabularyPractice?: Array<{sentence: string, answer: string}>;
    summary: string;
  };
  filename: string;
  isValid: boolean;
  errors: string[];
}

export default function AdminUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedLesson, setParsedLesson] = useState<ParsedLesson | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setSelectedFile(file);
      setParsedLesson(null);
    }
  };

  const parseContent = (content: string, filename: string): ParsedLesson => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract metadata from filename: WeekNumber_TopicName_Level_Language.txt
    const nameMatch = filename.match(/^(\d{3})_(.+)_(Beginner|Intermediate)_(.+)\.txt$/);
    const weekNumber = nameMatch?.[1] ? parseInt(nameMatch[1]) : 1;
    const topicName = nameMatch?.[2]?.replace(/_/g, ' ') || 'Unknown Topic';
    const levelFromFilename = nameMatch?.[3] || 'Unknown';
    const languageFromFilename = nameMatch?.[4] || 'Unknown';

    // Generate image filename: 001_glass_making
    const imageFilename = `${weekNumber.toString().padStart(3, '0')}_${topicName.toLowerCase().replace(/\s+/g, '_')}`;

    const lesson: ParsedLesson = {
      title: '',
      level: levelFromFilename,
      contentType: '',
      languageSupport: languageFromFilename,
      weekNumber: weekNumber,
      imageFilename: imageFilename,
      sections: {
        warmerQuestions: [],
        vocabularyPreview: [],
        readingText: '',
        trueFalse: [],
        summary: ''
      },
      filename,
      isValid: false,
      errors: []
    };

    let currentSection = '';
    let currentContent: string[] = [];

    const processSection = () => {
      const content = currentContent.join('\n').trim();
      
      switch (currentSection) {
        case 'LESSON_TITLE':
          lesson.title = content;
          break;
        case 'CONTENT_TYPE':
          lesson.contentType = content;
          break;
        case 'LANGUAGE_SUPPORT':
          lesson.languageSupport = content;
          break;
        case 'WARMER_QUESTIONS':
          // Handle both ESL format (numbered) and CLIL format (direct lines)
          if (content.includes('[') && content.includes(']')) {
            // CLIL multi-language format - each line is a question
            lesson.sections.warmerQuestions = content
              .split('\n')
              .filter(line => line.trim())
              .map(line => line.trim());
          } else {
            // ESL format - numbered questions
            lesson.sections.warmerQuestions = content
              .split('\n')
              .filter(line => line.match(/^\d+\./))
              .map(line => line.replace(/^\d+\.\s*/, ''));
          }
          break;
        case 'VOCABULARY_PREVIEW':
  const allParts = content.split(' / ').map(item => item.trim()).filter(item => item);
  
  // For CLIL multi-language: pairs are [word]-[translation] / [definition]-[def_translation]
  // For ESL: simple word-definition format
  
  lesson.sections.vocabularyPreview = [];
  
  // Check if this is multi-language format (contains brackets)
  if (content.includes('[') && content.includes(']')) {
    // CLIL format: group every 2 items as word-definition pairs
    for (let i = 0; i < allParts.length; i += 2) {
      const wordPart = allParts[i];      // [word]-[translation]  
      const defPart = allParts[i + 1];   // [definition]-[def_translation]
      
      if (wordPart && defPart) {
        lesson.sections.vocabularyPreview.push(`${wordPart} / ${defPart}`);
      } else if (wordPart) {
        // Odd number, add the remaining word
        lesson.sections.vocabularyPreview.push(wordPart);
      }
    }
  } else {
    // ESL format: each item is already a word-definition pair
    lesson.sections.vocabularyPreview = allParts;
  }
  
  console.log('Total vocabulary parts found:', allParts.length);
  console.log('Vocabulary pairs created:', lesson.sections.vocabularyPreview.length);
  console.log('Vocabulary pairs:', lesson.sections.vocabularyPreview);
  break;
        case 'READING_TEXT':
          lesson.sections.readingText = content;
          break;
        case 'TRUE_FALSE':
          // Handle both ESL and CLIL formats
          if (content.includes('[') && content.includes(']')) {
            // CLIL format: [English]-[Translation] (TRUE/FALSE)
            lesson.sections.trueFalse = content
              .split('\n')
              .filter(line => line.trim())
              .map(line => {
                const match = line.match(/^(.+?)\s+\((TRUE|FALSE)\)$/);
                return {
                  question: match?.[1] || line,
                  answer: match?.[2] === 'TRUE'
                };
              });
          } else {
            // ESL format: numbered with TRUE/FALSE at end
            lesson.sections.trueFalse = content
              .split('\n')
              .filter(line => line.match(/^\d+\./))
              .map(line => {
                const match = line.match(/^\d+\.\s*(.+?)\s+(TRUE|FALSE)$/);
                return {
                  question: match?.[1] || line,
                  answer: match?.[2] === 'TRUE'
                };
              });
          }
          break;
        case 'FIND_IN_TEXT':
          lesson.sections.findInText = content
            .split('\n')
            .filter(line => line.match(/^\d+\./))
            .map(line => {
              const match = line.match(/^\d+\.\s*(.+?)\s*\(Para (\d+)\):\s*(.+)$/);
              return {
                clue: match?.[1] || '',
                paragraph: parseInt(match?.[2] || '1'),
                answer: match?.[3] || ''
              };
            });
          break;
        case 'GRAMMAR_FOCUS':
          lesson.sections.grammarFocus = content
            .split('\n')
            .filter(line => line.match(/^\d+\./))
            .map(line => {
              const match = line.match(/^\d+\.\s*(.+?):\s*(.+)$/);
              return {
                sentence: match?.[1] || '',
                answer: match?.[2] || ''
              };
            });
          break;
        // Replace the SEQUENCE_PROCESS case with this simpler version:

case 'SEQUENCE_PROCESS':
  const lines = content.split('\n').filter(line => line.trim());
  
  let instructionLine = '';
  let stepsContent = '';
  
  // First line is the instruction, second line contains the steps with |
  if (lines.length >= 2) {
    instructionLine = lines[0]; // "Put the octopus defense steps in the correct order from first to last."
    stepsContent = lines[1];    // "[Change color to blend in]-[Změnit barvu pro sladění] | [Hide in small spaces]..."
  } else if (lines.length === 1) {
    // Only one line, check if it contains | (steps) or not (instruction)
    if (lines[0].includes('|')) {
      stepsContent = lines[0];
    } else {
      instructionLine = lines[0];
    }
  }
  
  // Parse steps separated by |
  if (stepsContent) {
    lesson.sections.sequenceProcess = stepsContent
      .split('|')
      .map(step => step.trim())
      .filter(step => step);
  }
    
  // Store instructions if found
  if (instructionLine) {
    lesson.sections.sequenceInstructions = instructionLine;
  }
  
  break;
        case 'VOCABULARY_PRACTICE':
          // Parse practice items: sentence (answer)
          lesson.sections.vocabularyPractice = content
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const match = line.match(/^(.+?)\s+\((.+?)\)$/);
              return {
                sentence: match?.[1] || line,
                answer: match?.[2] || ''
              };
            });
          break;
        case 'SUMMARY':
          lesson.sections.summary = content;
          break;
      }
    };

    for (const line of lines) {
      if (line.endsWith(':') && line.match(/^[A-Z_]+:$/)) {
        if (currentSection) {
          processSection();
        }
        currentSection = line.slice(0, -1);
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    
    if (currentSection) {
      processSection();
    }

    const requiredSections = ['LESSON_TITLE', 'WARMER_QUESTIONS', 'VOCABULARY_PREVIEW', 'READING_TEXT', 'TRUE_FALSE', 'SUMMARY'];
    const missingSections = requiredSections.filter(section => {
      switch (section) {
        case 'LESSON_TITLE': return !lesson.title;
        case 'WARMER_QUESTIONS': return lesson.sections.warmerQuestions.length === 0;
        case 'VOCABULARY_PREVIEW': return lesson.sections.vocabularyPreview.length === 0;
        case 'READING_TEXT': return !lesson.sections.readingText;
        case 'TRUE_FALSE': return lesson.sections.trueFalse.length === 0;
        case 'SUMMARY': return !lesson.sections.summary;
        default: return false;
      }
    });

    lesson.errors = missingSections.map(section => `Missing ${section.replace('_', ' ').toLowerCase()}`);
    lesson.isValid = lesson.errors.length === 0;

    return lesson;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const content = await selectedFile.text();
      const parsed = parseContent(content, selectedFile.name);
      setParsedLesson(parsed);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const saveToDatabase = async () => {
    if (!parsedLesson) return;

    try {
      setIsUploading(true);

      const lessonData = {
        title: parsedLesson.title,
        level: parsedLesson.level.toLowerCase(),
        content_type: parsedLesson.contentType.toLowerCase(),
        language_support: parsedLesson.languageSupport,
        filename: parsedLesson.filename,
        content_data: parsedLesson.sections,
        published: true,
        week_number: parsedLesson.weekNumber,
        image_filename: parsedLesson.imageFilename
      };

      const response = await fetch('/api/lessons/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Lesson saved successfully to database!');
        console.log('Saved lesson:', result.data);
      } else {
        alert(`❌ Error saving lesson: ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Error saving lesson to database');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            📤 Content Upload & Parser
          </h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Content File</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <div className="mb-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Choose .txt file
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-gray-500">
                  Upload structured content using the template format
                </p>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(selectedFile.size / 1024)} KB
                    </p>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? 'Parsing...' : 'Parse Content'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {parsedLesson && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Parsing Results</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Lesson Metadata</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Title:</span> {parsedLesson.title || 'Not found'}</div>
                    <div><span className="font-medium">Week Number:</span> {parsedLesson.weekNumber}</div>
                    <div><span className="font-medium">Image:</span> {parsedLesson.imageFilename}.jpg</div>
                    <div><span className="font-medium">Level:</span> {parsedLesson.level}</div>
                    <div><span className="font-medium">Content Type:</span> {parsedLesson.contentType || 'Not specified'}</div>
                    <div><span className="font-medium">Language Support:</span> {parsedLesson.languageSupport}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Content Sections</h3>
                  <div className="space-y-2 text-sm">
                    <div>Warmer Questions: {parsedLesson.sections.warmerQuestions.length}</div>
                    <div>Vocabulary Items: {parsedLesson.sections.vocabularyPreview.length}</div>
                    <div>Reading Text: {parsedLesson.sections.readingText ? '✓' : '✗'}</div>
                    <div>True/False Questions: {parsedLesson.sections.trueFalse.length}</div>
                    <div>Find in Text: {parsedLesson.sections.findInText?.length || 0}</div>
                    <div>Grammar Focus: {parsedLesson.sections.grammarFocus?.length || 0}</div>
                    <div>Sequence Instructions: {parsedLesson.sections.sequenceInstructions ? '✓' : '✗'}</div>
                    <div>Sequence Process: {parsedLesson.sections.sequenceProcess?.length || 0}</div>
                    <div>Vocabulary Practice: {parsedLesson.sections.vocabularyPractice?.length || 0}</div>
                  </div>
                </div>
              </div>

              {parsedLesson.errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Issues Found:</h3>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    {parsedLesson.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  👁️ {showPreview ? 'Hide' : 'Preview'} Lesson
                </button>
                <button
                  onClick={saveToDatabase}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  💾 Save to Database
                </button>
              </div>
            </div>
          )}

          {showPreview && parsedLesson && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Lesson Preview</h2>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-bold mb-4">{parsedLesson.title}</h1>
                
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Warmer Questions</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {parsedLesson.sections.warmerQuestions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ol>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Vocabulary Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {parsedLesson.sections.vocabularyPreview.map((item, index) => (
                      <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Reading Text</h3>
                  <div className="prose max-w-none">
                    {parsedLesson.sections.readingText.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">True/False Questions</h3>
                  <div className="space-y-2">
                    {parsedLesson.sections.trueFalse.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{item.question}</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.answer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.answer ? 'TRUE' : 'FALSE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {parsedLesson.sections.findInText && parsedLesson.sections.findInText.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Find in Text</h3>
                    <div className="space-y-2">
                      {parsedLesson.sections.findInText.map((item, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div><strong>Clue:</strong> {item.clue}</div>
                          <div><strong>Paragraph {item.paragraph}:</strong> {item.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsedLesson.sections.grammarFocus && parsedLesson.sections.grammarFocus.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Grammar Focus</h3>
                    <div className="space-y-2">
                      {parsedLesson.sections.grammarFocus.map((item, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div><strong>Sentence:</strong> {item.sentence}</div>
                          <div><strong>Answer:</strong> <span className="bg-yellow-200 px-1 rounded">{item.answer}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsedLesson.sections.sequenceProcess && parsedLesson.sections.sequenceProcess.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Sequence Process</h3>
                    {parsedLesson.sections.sequenceInstructions && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                        <strong>Instructions:</strong> {parsedLesson.sections.sequenceInstructions}
                      </div>
                    )}
                    <div className="space-y-2">
                      {parsedLesson.sections.sequenceProcess.map((step, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div><strong>Step {index + 1}:</strong> {step}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsedLesson.sections.vocabularyPractice && parsedLesson.sections.vocabularyPractice.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Vocabulary Practice</h3>
                    <div className="space-y-2">
                      {parsedLesson.sections.vocabularyPractice.map((item, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div><strong>Sentence:</strong> {item.sentence}</div>
                          <div><strong>Answer:</strong> <span className="bg-yellow-200 px-1 rounded">{item.answer}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="bg-blue-50 p-3 rounded">{parsedLesson.sections.summary}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}