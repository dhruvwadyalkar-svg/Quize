const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const normalizeText = (value) => String(value || '').trim();

const normalizeCorrectOptions = (correctOptions, optionsLength) => {
  if (!Array.isArray(correctOptions)) return [];
  return [...new Set(
    correctOptions
      .map((idx) => Number(idx))
      .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < optionsLength)
  )].sort((a, b) => a - b);
};

const inferType = (correctOptions) => {
  if (correctOptions.length <= 1) return 'single';
  return 'multiple';
};

export const normalizeQuestion = (raw = {}, defaults = {}) => {
  const options = Array.isArray(raw.options)
    ? raw.options.map((opt) => normalizeText(opt)).filter(Boolean)
    : [];

  let correctOptions = normalizeCorrectOptions(raw.correctOptions, options.length);

  const explicitType = raw.type === 'multiple' || raw.type === 'single'
    ? raw.type
    : raw.isMultiSelect
      ? 'multiple'
      : 'single';

  const type = explicitType || inferType(correctOptions);
  const isMultiSelect = type === 'multiple';

  if (!isMultiSelect && correctOptions.length > 1) {
    correctOptions = [correctOptions[0]];
  }

  const marks = Math.max(1, Number(raw.marks ?? defaults.marks ?? 1) || 1);
  const timeLimitSec = Math.max(
    0,
    Number(raw.timeLimit ?? raw.timeLimitSec ?? defaults.timeLimit ?? defaults.timeLimitSec ?? 30) || 0
  );

  return {
    text: normalizeText(raw.text),
    options,
    correctOptions,
    type: isMultiSelect ? 'multiple' : 'single',
    isMultiSelect,
    marks,
    timeLimitSec,
    explanation: normalizeText(raw.explanation),
  };
};

export const validateQuestion = (question, index = 0) => {
  const issues = [];
  const qNum = index + 1;

  if (!question.text) {
    issues.push(`Question ${qNum}: question text is missing.`);
  }

  if (question.options.length < MIN_OPTIONS) {
    issues.push(`Question ${qNum}: only ${question.options.length} option(s) detected (minimum ${MIN_OPTIONS}).`);
  }

  if (question.options.length > MAX_OPTIONS) {
    issues.push(`Question ${qNum}: too many options (${question.options.length}, maximum ${MAX_OPTIONS}).`);
  }

  const emptyOptions = question.options.filter((opt) => !normalizeText(opt));
  if (emptyOptions.length > 0) {
    issues.push(`Question ${qNum}: one or more options are empty.`);
  }

  if (question.correctOptions.length === 0) {
    issues.push(`Question ${qNum}: no correct answer detected.`);
  }

  const invalidIndexes = (question.correctOptions || []).filter(
    (idx) => idx < 0 || idx >= question.options.length
  );
  if (invalidIndexes.length > 0) {
    issues.push(`Question ${qNum}: detected invalid answer index(es).`);
  }

  if (!question.isMultiSelect && question.correctOptions.length !== 1) {
    issues.push(`Question ${qNum}: single-correct question must have exactly one correct answer.`);
  }

  if (question.isMultiSelect && question.correctOptions.length < 1) {
    issues.push(`Question ${qNum}: multiple-correct question must have at least one correct answer.`);
  }

  if (question.marks < 1 || question.marks > 100) {
    issues.push(`Question ${qNum}: marks must be between 1 and 100.`);
  }

  if (question.timeLimitSec < 0 || question.timeLimitSec > 600) {
    issues.push(`Question ${qNum}: time limit must be between 0 and 600 seconds.`);
  }

  return {
    ...question,
    validationStatus: issues.length === 0 ? 'valid' : 'needs_review',
    validationIssues: issues,
  };
};

const questionFingerprint = (question) =>
  `${question.text.toLowerCase()}|${question.options.map((o) => o.toLowerCase()).join('|')}`;

export const detectDuplicates = (questions) => {
  const seen = new Map();
  return questions.map((question, index) => {
    const fingerprint = questionFingerprint(question);
    const issues = [...(question.validationIssues || [])];

    if (seen.has(fingerprint)) {
      issues.push(`Question ${index + 1}: possible duplicate of question ${seen.get(fingerprint) + 1}.`);
    } else {
      seen.set(fingerprint, index);
    }

    return {
      ...question,
      validationIssues: issues,
      validationStatus: issues.length === 0 ? 'valid' : 'needs_review',
    };
  });
};

export const normalizeAndValidateQuestions = (rawQuestions = [], defaults = {}) => {
  if (!Array.isArray(rawQuestions)) {
    throw new Error('Invalid AI response: questions must be an array.');
  }

  const normalized = rawQuestions.map((raw) => normalizeQuestion(raw, defaults));
  const validated = normalized.map((q, i) => validateQuestion(q, i));
  return detectDuplicates(validated);
};

export const toQuizPayloadQuestion = (question) => ({
  text: question.text,
  options: question.options,
  correctOptions: question.correctOptions,
  marks: question.marks,
  timeLimitSec: question.timeLimitSec,
  isMultiSelect: question.isMultiSelect,
});

export const parseGeminiJson = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned an empty response.');
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
    throw new Error('Gemini returned malformed JSON. Please try again.');
  }
};
