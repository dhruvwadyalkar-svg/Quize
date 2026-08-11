import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeAndValidateQuestions, parseGeminiJson } from '../utils/questionValidator.js';

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in backend .env.');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });
};

const callGemini = async (prompt, timeoutMs = 60000) => {
  const model = getModel();

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Gemini request timed out. Please try again.')), timeoutMs);
  });

  const result = await Promise.race([
    model.generateContent(prompt),
    timeoutPromise,
  ]);

  const response = result.response;
  const text = response.text();

  return parseGeminiJson(text);
};

const buildGeneratePrompt = ({
  topic,
  count,
  difficulty,
  type,
  optionsCount,
  marks,
  timeLimit,
  instructions,
  existingQuestions = [],
}) => {
  const existingContext = existingQuestions.length
    ? `\n\nExisting questions (DO NOT duplicate or closely rephrase these):\n${JSON.stringify(
        existingQuestions.map((q) => ({ text: q.text, options: q.options })),
        null,
        2
      )}`
    : '';

  return `You are an expert educational quiz generator.

Generate high-quality multiple-choice questions based strictly on the requested topic.

Requirements:
1. Follow the requested number of questions: ${count}.
2. Match the requested difficulty: ${difficulty}.
3. Use the requested question type: ${type} (single = exactly one correct, multiple = two or more correct, mixed = vary).
4. Provide exactly ${optionsCount} options per question (between 2 and 6).
5. For single-correct questions, exactly ONE option must be correct.
6. For multiple-correct questions, TWO OR MORE options must be correct.
7. Correct answers must actually be correct.
8. Distractors must be plausible but clearly incorrect.
9. Avoid ambiguous questions.
10. Avoid duplicate or highly similar questions.
11. Avoid questions with multiple interpretations.
12. Avoid trick questions unless explicitly requested.
13. Keep questions suitable for an academic quiz.
14. Include a short explanation for the correct answer.
15. Return structured JSON only.
16. Do not return Markdown.
17. Do not add commentary outside the JSON structure.
18. Use zero-based indexes for correctOptions.

Topic: ${topic}
Default marks per question: ${marks}
Default time limit per question (seconds): ${timeLimit}
Additional instructions: ${instructions || 'None'}${existingContext}

Return JSON in this exact shape:
{
  "questions": [
    {
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptions": [2],
      "type": "single",
      "marks": ${marks},
      "timeLimit": ${timeLimit},
      "explanation": "Brief explanation"
    }
  ]
}`;
};

const buildParsePrompt = (content, defaults = {}) => {
  const marks = defaults.marks ?? 1;
  const timeLimit = defaults.timeLimit ?? 30;

  return `You are an expert quiz question parser.

Parse the pasted quiz content and convert it into structured multiple-choice questions.

Requirements:
1. Detect individual questions even if formatting varies.
2. Detect options labeled A/B/C/D, 1/2/3/4, bullets, or plain lines.
3. Detect correct answers from lines like "Answer: C", "Correct: A, C", etc.
4. Detect single vs multiple correct answers.
5. Normalize formatting and remove unnecessary numbering.
6. Normalize option labels to plain option text.
7. Identify missing information and invalid answers.
8. Convert everything into the required JSON schema.
9. Use zero-based indexes for correctOptions.
10. Return structured JSON only. No Markdown. No commentary.

Default marks: ${marks}
Default time limit (seconds): ${timeLimit}

Pasted content:
"""
${content}
"""

Return JSON in this exact shape:
{
  "questions": [
    {
      "text": "Question text",
      "options": ["Option 1", "Option 2"],
      "correctOptions": [0],
      "type": "single",
      "marks": ${marks},
      "timeLimit": ${timeLimit},
      "explanation": "Optional explanation if inferable"
    }
  ]
}`;
};

const buildRegeneratePrompt = ({
  topic,
  difficulty,
  type,
  marks,
  timeLimit,
  optionsCount,
  existingQuestions = [],
  questionToReplace = {},
}) => {
  const avoidList = existingQuestions
    .map((q) => q.text)
    .filter(Boolean)
    .join('\n- ');

  return `You are an expert educational quiz generator.

Regenerate ONE new multiple-choice question to replace an existing question.

Requirements:
1. Topic: ${topic}
2. Difficulty: ${difficulty}
3. Question type: ${type}
4. Provide exactly ${optionsCount} options.
5. Marks: ${marks}
6. Time limit (seconds): ${timeLimit}
7. Must be different from all existing questions listed below.
8. Follow all quality rules: unambiguous, academically sound, plausible distractors.
9. Include explanation.
10. Return JSON only with a single question in a questions array.
11. Use zero-based indexes for correctOptions.

Existing questions to avoid duplicating:
- ${avoidList || 'None'}

Question being replaced:
${JSON.stringify({ text: questionToReplace.text, options: questionToReplace.options }, null, 2)}

Return JSON:
{
  "questions": [
    {
      "text": "...",
      "options": ["...", "..."],
      "correctOptions": [0],
      "type": "${type === 'multiple' ? 'multiple' : 'single'}",
      "marks": ${marks},
      "timeLimit": ${timeLimit},
      "explanation": "..."
    }
  ]
}`;
};

export const generateQuestions = async (params) => {
  const {
    topic,
    count = 10,
    difficulty = 'mixed',
    type = 'mixed',
    optionsCount = 4,
    marks = 1,
    timeLimit = 30,
    instructions = '',
    existingQuestions = [],
  } = params;

  if (!topic?.trim()) {
    throw new Error('Topic is required.');
  }

  const safeCount = Math.min(Math.max(Number(count) || 1, 1), 50);
  const safeOptions = Math.min(Math.max(Number(optionsCount) || 4, 2), 6);

  const prompt = buildGeneratePrompt({
    topic: topic.trim(),
    count: safeCount,
    difficulty,
    type,
    optionsCount: safeOptions,
    marks: Number(marks) || 1,
    timeLimit: Number(timeLimit) || 30,
    instructions,
    existingQuestions,
  });

  const parsed = await callGemini(prompt);
  const questions = normalizeAndValidateQuestions(parsed.questions || [], {
    marks,
    timeLimit,
  });

  if (questions.length === 0) {
    throw new Error('Gemini did not return any valid questions.');
  }

  return { questions, meta: { requested: safeCount, received: questions.length } };
};

export const parseQuestions = async (content, defaults = {}) => {
  if (!content?.trim()) {
    throw new Error('Pasted content is required.');
  }

  const prompt = buildParsePrompt(content, defaults);
  const parsed = await callGemini(prompt, 90000);
  const questions = normalizeAndValidateQuestions(parsed.questions || [], defaults);

  if (questions.length === 0) {
    throw new Error('No questions could be parsed from the pasted content.');
  }

  return { questions, meta: { received: questions.length } };
};

export const regenerateQuestion = async (params) => {
  const {
    topic,
    difficulty = 'medium',
    type = 'single',
    marks = 1,
    timeLimit = 30,
    optionsCount = 4,
    existingQuestions = [],
    questionToReplace = {},
  } = params;

  if (!topic?.trim()) {
    throw new Error('Topic is required for regeneration.');
  }

  const safeOptions = Math.min(Math.max(Number(optionsCount) || 4, 2), 6);

  const prompt = buildRegeneratePrompt({
    topic: topic.trim(),
    difficulty,
    type,
    marks: Number(marks) || 1,
    timeLimit: Number(timeLimit) || 30,
    optionsCount: safeOptions,
    existingQuestions,
    questionToReplace,
  });

  const parsed = await callGemini(prompt);
  const questions = normalizeAndValidateQuestions(parsed.questions || [], {
    marks,
    timeLimit,
  });

  if (questions.length === 0) {
    throw new Error('Failed to regenerate question.');
  }

  return { question: questions[0] };
};
