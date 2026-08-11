import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { ArrowLeft, Save, AlertCircle, Clock, HelpCircle, ChevronRight, ChevronLeft } from 'lucide-react';

import { CreateMethodSelector } from '../../components/quiz/CreateMethodSelector';
import { GenerateQuestionsForm } from '../../components/quiz/GenerateQuestionsForm';
import { PasteQuestionsForm } from '../../components/quiz/PasteQuestionsForm';
import { GenerationLoading } from '../../components/quiz/GenerationLoading';
import { QuestionReview } from '../../components/quiz/QuestionReview';

import {
  createEmptyQuestion,
  fromApiQuestion,
  revalidateAll,
  toQuizSubmitQuestion,
  canSaveQuiz,
  getSummary,
} from '../../utils/questionUtils';

const STEPS = ['setup', 'method', 'create', 'review'];

export const CreateQuiz = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState('setup');
  const [method, setMethod] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [perQuestionTimeSec, setPerQuestionTimeSec] = useState(0);

  const [questions, setQuestions] = useState([]);
  const [aiContext, setAiContext] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [refining, setRefining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
  const summary = getSummary(questions);

  const goToReview = (newQuestions, context = null) => {
    setQuestions(revalidateAll(newQuestions));
    if (context) setAiContext(context);
    setStep('review');
  };

  const handleMethodSelect = (selected) => {
    setMethod(selected);
    setError('');

    if (selected === 'manual') {
      goToReview([createEmptyQuestion()]);
      setAiContext(null);
    }
  };

  const handleGenerate = async (params) => {
    setAiLoading(true);
    setError('');
    try {
      const response = await API.post('/ai/generate-questions', params);
      const mapped = response.data.questions.map(fromApiQuestion);
      goToReview(mapped, {
        topic: params.topic,
        difficulty: params.difficulty,
        type: params.type,
        optionsCount: params.optionsCount,
        marks: params.marks,
        timeLimit: params.timeLimit,
        instructions: params.instructions,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleParse = async (params) => {
    setAiLoading(true);
    setError('');
    try {
      const response = await API.post('/ai/parse-questions', params);
      const mapped = response.data.questions.map(fromApiQuestion);
      goToReview(mapped, {
        topic: title || 'Imported Questions',
        marks: params.marks,
        timeLimit: params.timeLimit,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse questions. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRegenerate = async (index) => {
    if (!aiContext) return;
    setRegeneratingIndex(index);
    setError('');

    const questionToReplace = questions[index];

    try {
      const response = await API.post('/ai/regenerate-question', {
        topic: aiContext.topic || title,
        difficulty: aiContext.difficulty || 'medium',
        type: questionToReplace.isMultiSelect ? 'multiple' : 'single',
        marks: questionToReplace.marks,
        timeLimit: questionToReplace.timeLimitSec,
        optionsCount: questionToReplace.options.length,
        existingQuestions: questions.map((q) => ({ text: q.text, options: q.options })),
        questionToReplace: { text: questionToReplace.text, options: questionToReplace.options },
      });

      const regenerated = fromApiQuestion(response.data.question);
      const updated = [...questions];
      updated[index] = { ...regenerated, _localId: questions[index]._localId };
      setQuestions(revalidateAll(updated));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate question.');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleGenerateMore = async ({ count, difficulty }) => {
    if (!aiContext) return;
    setGeneratingMore(true);
    setError('');

    try {
      const response = await API.post('/ai/generate-questions', {
        topic: aiContext.topic || title,
        count,
        difficulty,
        type: aiContext.type || 'mixed',
        optionsCount: aiContext.optionsCount || 4,
        marks: aiContext.marks || 1,
        timeLimit: aiContext.timeLimit || 30,
        instructions: aiContext.instructions || '',
        existingQuestions: questions.map((q) => ({ text: q.text, options: q.options })),
      });

      const newQuestions = response.data.questions.map(fromApiQuestion);
      setQuestions(revalidateAll([...questions, ...newQuestions]));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate more questions.');
    } finally {
      setGeneratingMore(false);
    }
  };

  const handleRefine = async (instruction) => {
    if (!aiContext) return;
    setRefining(true);
    setError('');
    try {
      const response = await API.post('/ai/refine-questions', {
        topic: aiContext.topic || title,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options,
          correctOptions: q.correctOptions,
          marks: q.marks,
          timeLimitSec: q.timeLimitSec,
          type: q.type,
        })),
        instruction,
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refine questions.');
      throw err;
    } finally {
      setRefining(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a quiz title.');
      setStep('setup');
      return;
    }

    if (!canSaveQuiz(questions)) {
      setError(`Please fix all questions before saving. ${summary.needsReview} question(s) need review.`);
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/quizzes', {
        title,
        description,
        durationMinutes: Number(durationMinutes),
        perQuestionTimeSec: Number(perQuestionTimeSec),
        questions: questions.map(toQuizSubmitQuestion),
      });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedFromSetup = title.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">Quiz Creator</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        {['Setup', 'Method', 'Create', 'Review'].map((label, i) => {
          const stepKey = STEPS[i];
          const isActive = step === stepKey;
          const isPast = STEPS.indexOf(step) > i;
          return (
            <React.Fragment key={label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
              <span className={isActive ? 'text-indigo-400' : isPast ? 'text-emerald-400' : 'text-slate-500'}>
                {label}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Setup */}
      {step === 'setup' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/10">
            <h2 className="text-2xl font-extrabold text-white font-outfit border-b border-slate-800 pb-4">
              1. Quiz General Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Quiz Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Python Programming Quiz"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-semibold text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Description / Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief instructions for students..."
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" /> Quiz Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-400" /> Per-Question Timer Override (Seconds)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={perQuestionTimeSec}
                    onChange={(e) => setPerQuestionTimeSec(e.target.value)}
                    placeholder="0 = Use overall quiz duration"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canProceedFromSetup}
              onClick={() => setStep('method')}
              className="gradient-button px-8 py-3 rounded-xl font-extrabold text-white flex items-center gap-2 disabled:opacity-50"
            >
              Next: Choose Method <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Method selection */}
      {step === 'method' && (
        <div className="space-y-6">
          <CreateMethodSelector selected={method} onSelect={handleMethodSelect} />

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep('setup')} className="px-6 py-3 rounded-xl bg-slate-800 font-bold text-sm text-slate-300 flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {method && method !== 'manual' && (
              <button
                type="button"
                onClick={() => setStep('create')}
                className="gradient-button px-8 py-3 rounded-xl font-extrabold text-white flex items-center gap-2"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Create (AI forms) */}
      {step === 'create' && (
        <div className="space-y-6">
          {aiLoading ? (
            <GenerationLoading message={method === 'paste' ? 'Analyzing Questions...' : 'Generating Questions...'} />
          ) : (
            <>
              {method === 'generate' && (
                <GenerateQuestionsForm onGenerate={handleGenerate} loading={aiLoading} defaultTopic={title} />
              )}
              {method === 'paste' && (
                <PasteQuestionsForm onAnalyze={handleParse} loading={aiLoading} />
              )}
            </>
          )}

          {!aiLoading && (
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep('method')} className="px-6 py-3 rounded-xl bg-slate-800 font-bold text-sm text-slate-300 flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review & Save */}
      {step === 'review' && (
        <div className="space-y-6">
          <QuestionReview
            questions={questions}
            onChange={setQuestions}
            aiContext={aiContext}
            onRegenerate={aiContext ? handleRegenerate : null}
            onGenerateMore={aiContext ? handleGenerateMore : null}
            onRefine={aiContext ? handleRefine : null}
            refining={refining}
            regeneratingIndex={regeneratingIndex}
            generatingMore={generatingMore}
          />

          {/* Quiz summary before save */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
            <h3 className="font-extrabold text-white text-lg">{title || 'Untitled Quiz'}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span>Questions: {questions.length}</span>
              <span>Total Marks: {totalMarks}</span>
              <span>Duration: {durationMinutes} minutes</span>
            </div>
            {summary.needsReview > 0 && (
              <p className="text-xs text-amber-400">
                Fix {summary.needsReview} question(s) marked &quot;Needs Review&quot; before saving.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (method === 'manual' || !method) setStep('method');
                else if (aiContext) setStep('create');
                else setStep('method');
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-sm text-slate-300 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canSaveQuiz(questions)}
              className="gradient-button px-8 py-3.5 rounded-xl font-extrabold text-white shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-105 transition-all"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Quiz
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
