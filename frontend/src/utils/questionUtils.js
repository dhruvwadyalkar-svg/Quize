export const createEmptyQuestion = (overrides = {}) => ({
  _localId: crypto.randomUUID(),
  text: '',
  options: ['', '', '', ''],
  correctOptions: [0],
  isMultiSelect: false,
  type: 'single',
  marks: 1,
  timeLimitSec: 30,
  explanation: '',
  validationStatus: 'needs_review',
  validationIssues: ['Question text is missing.', 'One or more options are empty.'],
  ...overrides,
});

export const fromApiQuestion = (q) => ({
  _localId: crypto.randomUUID(),
  text: q.text || '',
  options: q.options?.length ? [...q.options] : ['', ''],
  correctOptions: q.correctOptions?.length ? [...q.correctOptions] : [0],
  isMultiSelect: q.isMultiSelect ?? q.type === 'multiple',
  type: q.type || (q.isMultiSelect ? 'multiple' : 'single'),
  marks: q.marks ?? 1,
  timeLimitSec: q.timeLimitSec ?? q.timeLimit ?? 30,
  explanation: q.explanation || '',
  validationStatus: q.validationStatus || 'valid',
  validationIssues: q.validationIssues || [],
});

export const validateQuestionClient = (question, index = 0) => {
  const issues = [];
  const qNum = index + 1;

  if (!question.text?.trim()) {
    issues.push(`Question ${qNum}: question text is missing.`);
  }

  const options = (question.options || []).map((o) => String(o || '').trim());
  const filledOptions = options.filter(Boolean);

  if (filledOptions.length < 2) {
    issues.push(`Question ${qNum}: only ${filledOptions.length} option(s) detected (minimum 2).`);
  }

  if (options.length > 6) {
    issues.push(`Question ${qNum}: too many options (maximum 6).`);
  }

  if (options.some((o) => !o)) {
    issues.push(`Question ${qNum}: one or more options are empty.`);
  }

  const correctOptions = question.correctOptions || [];
  if (correctOptions.length === 0) {
    issues.push(`Question ${qNum}: no correct answer selected.`);
  }

  const invalidIndexes = correctOptions.filter((idx) => idx < 0 || idx >= options.length);
  if (invalidIndexes.length > 0) {
    issues.push(`Question ${qNum}: invalid correct answer index detected.`);
  }

  if (!question.isMultiSelect && correctOptions.length !== 1) {
    issues.push(`Question ${qNum}: single-correct must have exactly one correct answer.`);
  }

  return {
    ...question,
    options,
    validationIssues: issues,
    validationStatus: issues.length === 0 ? 'valid' : 'needs_review',
  };
};

export const detectDuplicatesClient = (questions) => {
  const seen = new Map();

  return questions.map((question, index) => {
    const fingerprint = `${question.text.toLowerCase().trim()}|${question.options.map((o) => o.toLowerCase().trim()).join('|')}`;
    const issues = [...(question.validationIssues || [])];

    if (question.text.trim() && seen.has(fingerprint)) {
      issues.push(`Question ${index + 1}: possible duplicate of question ${seen.get(fingerprint) + 1}.`);
    } else if (question.text.trim()) {
      seen.set(fingerprint, index);
    }

    return {
      ...question,
      validationIssues: issues,
      validationStatus: issues.length === 0 ? 'valid' : 'needs_review',
    };
  });
};

export const revalidateAll = (questions) => {
  const validated = questions.map((q, i) => validateQuestionClient(q, i));
  return detectDuplicatesClient(validated);
};

export const toQuizSubmitQuestion = (q) => ({
  text: q.text.trim(),
  options: q.options.map((o) => o.trim()),
  correctOptions: q.correctOptions,
  marks: Number(q.marks) || 1,
  timeLimitSec: Number(q.timeLimitSec) || 0,
  isMultiSelect: q.isMultiSelect,
});

export const canSaveQuiz = (questions) =>
  questions.length > 0 && questions.every((q) => q.validationStatus === 'valid');

export const getSummary = (questions) => ({
  total: questions.length,
  valid: questions.filter((q) => q.validationStatus === 'valid').length,
  needsReview: questions.filter((q) => q.validationStatus === 'needs_review').length,
});
