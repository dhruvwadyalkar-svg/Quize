import { normalizeAndValidateQuestions, parseGeminiJson } from '../utils/questionValidator.js';

const callGroq = async (prompt, timeoutMs = 90000) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API key is not configured. Set GROQ_API_KEY in backend .env.');
  }

  const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const payload = {
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: modelName,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Groq API request timed out. Please try again.')), timeoutMs);
  });

  const responsePromise = (async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API text generation failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Groq returned an empty response.');
    }
    return data.choices[0].message.content;
  })();

  const generatedText = await Promise.race([
    responsePromise,
    timeoutPromise,
  ]);

  try {
    return parseGeminiJson(generatedText);
  } catch (err) {
    console.error('Failed to parse JSON from Groq response:', generatedText);
    throw err;
  }
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

  const parsed = await callGroq(prompt);
  const questions = normalizeAndValidateQuestions(parsed.questions || [], {
    marks,
    timeLimit,
  });

  if (questions.length === 0) {
    throw new Error('Groq did not return any valid questions.');
  }

  return { questions, meta: { requested: safeCount, received: questions.length } };
};

export const parseQuestions = async (content, defaults = {}) => {
  if (!content?.trim()) {
    throw new Error('Pasted content is required.');
  }

  const prompt = buildParsePrompt(content, defaults);
  const parsed = await callGroq(prompt, 90000);
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

  const parsed = await callGroq(prompt);
  const questions = normalizeAndValidateQuestions(parsed.questions || [], {
    marks,
    timeLimit,
  });

  if (questions.length === 0) {
    throw new Error('Failed to regenerate question.');
  }

  return { question: questions[0] };
};

const buildRefinePrompt = ({ topic, questions, instruction }) => {
  return `You are an expert educational quiz editor.

You are given an existing quiz and an administrator's instruction.
Your task is to modify the existing questions according to the administrator's instruction.

Input Context:
Topic: ${topic}
Questions:
${JSON.stringify(questions, null, 2)}

Administrator's Instruction:
"${instruction}"

IMPORTANT RULES:
1. Follow the administrator's instruction precisely.
2. Make the minimum necessary changes.
3. Do not modify questions that are not affected by the instruction.
4. Preserve the existing question IDs/indexes whenever possible (e.g. "q1", "q2").
5. If specific question numbers or IDs are mentioned, modify only those questions.
6. If the administrator requests a certain number of questions to be harder, modify exactly that number when possible.
7. If the administrator requests new questions to be added, create only the requested number, assigning them IDs like "new1", "new2", etc.
8. If the administrator requests to delete or replace questions, specify the appropriate action ("deleted" or "modified").
9. Avoid duplicate questions.
10. Maintain factual correctness.
11. Maintain the requested topic.
12. Maintain valid MCQ structure.
13. Single-correct questions must have exactly one correct option.
14. Multiple-correct questions must have valid correct option indexes (zero-based).
15. Options must be plausible but distractors must be incorrect.
16. Avoid ambiguous questions.
17. Preserve marks and time limits unless the administrator explicitly asks to change them.
18. Return structured JSON only.
19. Do not return Markdown.
20. Do not add explanations outside the JSON.

Expected JSON Response Format:
{
  "changes": [
    {
      "questionId": "q3",
      "action": "modified", // "modified" | "added" | "deleted"
      "reason": "Increased difficulty and converted to output-based question.",
      "question": {
        "text": "What will be the output of the following Python code?",
        "options": [
          "10",
          "20",
          "30",
          "Error"
        ],
        "correctOptions": [1],
        "type": "single",
        "marks": 1,
        "timeLimit": 30,
        "explanation": "..."
      }
    }
  ]
}`;
};

export const refineQuestions = async (params) => {
  const { topic, questions = [], instruction } = params;

  if (!topic?.trim()) {
    throw new Error('Topic is required for refinement.');
  }
  if (!instruction?.trim()) {
    throw new Error('Instruction is required for refinement.');
  }

  // Format questions for Groq context to use simple IDs like q1, q2
  const formattedQuestions = questions.map((q, i) => ({
    id: `q${i + 1}`,
    text: q.text,
    options: q.options,
    correctOptions: q.correctOptions,
    type: q.type || (q.isMultiSelect ? 'multiple' : 'single'),
    marks: q.marks ?? 1,
    timeLimit: q.timeLimitSec ?? q.timeLimit ?? 30,
  }));

  const prompt = buildRefinePrompt({
    topic: topic.trim(),
    questions: formattedQuestions,
    instruction: instruction.trim(),
  });

  const parsed = await callGroq(prompt);
  return parsed;
};
