import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Edit3,
  RefreshCw,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Sparkles,
  X,
  CheckSquare,
  CircleDot,
  Undo,
} from 'lucide-react';
import { revalidateAll, createEmptyQuestion, getSummary, fromApiQuestion } from '../../utils/questionUtils';

const SUGGESTION_CHIPS = [
  { label: '✨ Make 3 Harder', prompt: 'Make 3 questions harder.' },
  { label: '💻 Add Output Questions', prompt: 'Add 2 tricky Python output-based questions.' },
  { label: '🧠 Focus on OOP', prompt: 'Create more questions related to Python OOP.' },
  { label: '🛡️ Scenario-Based', prompt: 'Make questions 4 and 7 scenario-based.' },
  { label: '⚡ Improve Distractors', prompt: 'Make the distractors more confusing but still technically incorrect.' },
  { label: '🔄 Replace Easiest', prompt: 'Replace the easiest 2 questions with advanced questions.' },
];

export const QuestionReview = ({
  questions,
  onChange,
  aiContext = null,
  onRegenerate,
  onGenerateMore,
  onRefine,
  refining = false,
  regeneratingIndex = null,
  generatingMore = false,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [showGenerateMore, setShowGenerateMore] = useState(false);
  const [moreCount, setMoreCount] = useState(5);
  const [moreDifficulty, setMoreDifficulty] = useState('mixed');

  // Refinement states
  const [instruction, setInstruction] = useState('');
  const [previewChanges, setPreviewChanges] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [refinementError, setRefinementError] = useState('');

  const summary = getSummary(questions);

  const updateQuestions = (updated) => {
    onChange(revalidateAll(updated));
  };

  const handleApplyRefinement = async () => {
    if (!instruction.trim() || !onRefine) return;
    setRefinementError('');
    setWarnings([]);
    try {
      const result = await onRefine(instruction);
      if (result && Array.isArray(result.changes)) {
        setPreviewChanges(result.changes);
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
      } else {
        setRefinementError('AI generated an invalid modification. The original question has NOT been changed.');
      }
    } catch (err) {
      setRefinementError(err.message || 'Failed to apply refinement changes.');
    }
  };

  const handleAcceptChange = (cIdx) => {
    const change = previewChanges[cIdx];
    const updated = [...questions];

    if (change.action === 'modified') {
      const qIndex = parseInt(change.questionId.replace('q', '')) - 1;
      if (qIndex >= 0 && qIndex < questions.length) {
        const orig = questions[qIndex];
        updated[qIndex] = {
          ...fromApiQuestion(change.question),
          _localId: orig._localId,
          history: [...(orig.history || []), {
            text: orig.text,
            options: [...orig.options],
            correctOptions: [...orig.correctOptions],
            isMultiSelect: orig.isMultiSelect,
            type: orig.type,
            marks: orig.marks,
            timeLimitSec: orig.timeLimitSec,
            explanation: orig.explanation,
            validationStatus: orig.validationStatus,
            validationIssues: [...orig.validationIssues],
          }],
        };
      }
    } else if (change.action === 'added') {
      const newQ = {
        ...fromApiQuestion(change.question),
        history: [{ isNewAdded: true }],
      };
      updated.push(newQ);
    } else if (change.action === 'deleted') {
      const qIndex = parseInt(change.questionId.replace('q', '')) - 1;
      if (qIndex >= 0 && qIndex < questions.length) {
        updated.splice(qIndex, 1);
      }
    }

    updateQuestions(updated);
    setPreviewChanges(previewChanges.filter((_, idx) => idx !== cIdx));
  };

  const handleRejectChange = (cIdx) => {
    setPreviewChanges(previewChanges.filter((_, idx) => idx !== cIdx));
  };

  const handleAcceptAll = () => {
    let updated = [...questions];
    // Track deleted indices to filter out, modifications, and additions
    const toDelete = [];
    const additions = [];

    // Sort changes so that modifications are made safely, and deletions/additions don't mess up indexes prematurely
    previewChanges.forEach((change) => {
      if (change.action === 'modified') {
        const qIndex = parseInt(change.questionId.replace('q', '')) - 1;
        if (qIndex >= 0 && qIndex < questions.length) {
          const orig = questions[qIndex];
          updated[qIndex] = {
            ...fromApiQuestion(change.question),
            _localId: orig._localId,
            history: [...(orig.history || []), {
              text: orig.text,
              options: [...orig.options],
              correctOptions: [...orig.correctOptions],
              isMultiSelect: orig.isMultiSelect,
              type: orig.type,
              marks: orig.marks,
              timeLimitSec: orig.timeLimitSec,
              explanation: orig.explanation,
              validationStatus: orig.validationStatus,
              validationIssues: [...orig.validationIssues],
            }],
          };
        }
      } else if (change.action === 'added') {
        additions.push({
          ...fromApiQuestion(change.question),
          history: [{ isNewAdded: true }],
        });
      } else if (change.action === 'deleted') {
        const qIndex = parseInt(change.questionId.replace('q', '')) - 1;
        if (qIndex >= 0 && qIndex < questions.length) {
          toDelete.push(qIndex);
        }
      }
    });

    // Filter out deleted
    if (toDelete.length > 0) {
      updated = updated.filter((_, idx) => !toDelete.includes(idx));
    }

    // Append additions
    if (additions.length > 0) {
      updated = [...updated, ...additions];
    }

    updateQuestions(updated);
    setPreviewChanges([]);
  };

  const handleRejectAll = () => {
    setPreviewChanges([]);
  };

  const handleUndo = (idx) => {
    const q = questions[idx];
    if (!q.history || q.history.length === 0) return;
    const prev = q.history[q.history.length - 1];

    if (prev.isNewAdded) {
      updateQuestions(questions.filter((_, i) => i !== idx));
      return;
    }

    const restored = {
      ...q,
      text: prev.text,
      options: prev.options,
      correctOptions: prev.correctOptions,
      isMultiSelect: prev.isMultiSelect,
      type: prev.type,
      marks: prev.marks,
      timeLimitSec: prev.timeLimitSec,
      explanation: prev.explanation,
      validationStatus: prev.validationStatus,
      validationIssues: prev.validationIssues,
      history: q.history.slice(0, -1),
    };

    const updated = [...questions];
    updated[idx] = restored;
    updateQuestions(updated);
  };

  const handleDelete = (index) => {
    if (questions.length <= 1) return;
    updateQuestions(questions.filter((_, i) => i !== index));
  };

  const handleDuplicate = (index) => {
    const copy = {
      ...questions[index],
      _localId: crypto.randomUUID(),
      text: `${questions[index].text} (copy)`,
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, copy);
    updateQuestions(updated);
  };

  const handleMove = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updateQuestions(updated);
  };

  const handleAddQuestion = () => {
    updateQuestions([...questions, createEmptyQuestion()]);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setEditDraft(JSON.parse(JSON.stringify(questions[index])));
  };

  const saveEdit = () => {
    if (editingIndex === null || !editDraft) return;
    const updated = [...questions];
    updated[editingIndex] = editDraft;
    updateQuestions(updated);
    setEditingIndex(null);
    setEditDraft(null);
  };

  const handleGenerateMore = () => {
    if (!onGenerateMore) return;
    onGenerateMore({ count: Number(moreCount), difficulty: moreDifficulty });
    setShowGenerateMore(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-outfit">Review Questions</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              <span className="text-slate-300">{summary.total} Questions</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {summary.valid} Valid
              </span>
              {summary.needsReview > 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> {summary.needsReview} Needs Review
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
            {onGenerateMore && aiContext && (
              <button
                type="button"
                onClick={() => setShowGenerateMore(!showGenerateMore)}
                className="px-4 py-2 rounded-xl gradient-button text-sm font-bold text-white flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Generate More
              </button>
            )}
          </div>
        </div>

        {showGenerateMore && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-3">
            <p className="text-sm text-slate-300">Current Questions: {questions.length}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Generate additional</label>
                <input type="number" min={1} max={20} value={moreCount} onChange={(e) => setMoreCount(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Difficulty</label>
                <select value={moreDifficulty} onChange={(e) => setMoreDifficulty(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGenerateMore}
                  disabled={generatingMore}
                  className="w-full px-4 py-2 rounded-lg gradient-button text-sm font-bold text-white disabled:opacity-50"
                >
                  {generatingMore ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Question Refinement Box */}
      {onRefine && (
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 space-y-4 relative overflow-hidden bg-slate-900/40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white font-outfit">✨ AI Question Refinement</h3>
          </div>
          
          <p className="text-xs text-slate-300">
            Tell AI what you want to change about the questions (e.g. "Make questions 3 and 7 harder.")
          </p>

          <textarea
            rows={3}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={refining}
            placeholder="Tell AI what you want to change..."
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-105 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quick Actions:</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(chip.prompt)}
                  disabled={refining}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleApplyRefinement}
              disabled={refining || !instruction.trim()}
              className="px-6 py-2.5 rounded-xl gradient-button text-sm font-bold text-white flex items-center gap-1.5 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {refining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Applying AI Changes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Apply AI Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Detailed loading screen during refinement */}
      {refining && (
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-slate-900/70 flex flex-col items-center justify-center py-10 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <Sparkles className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="text-center space-y-3">
            <h4 className="text-white font-bold text-base font-outfit">✨ AI is analyzing your instruction...</h4>
            <div className="text-xs text-slate-400 space-y-1 select-none font-medium">
              <p className="animate-pulse">Identifying affected questions...</p>
              <p className="animate-pulse" style={{ animationDelay: '200ms' }}>Generating modifications...</p>
              <p className="animate-pulse" style={{ animationDelay: '400ms' }}>Validating answers...</p>
              <p className="animate-pulse" style={{ animationDelay: '600ms' }}>Preparing changes...</p>
            </div>
          </div>
        </div>
      )}

      {/* Refinement error panel */}
      {refinementError && (
        <div className="p-5 rounded-2xl bg-red-950/60 border border-red-500/50 flex flex-col gap-3 text-red-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{refinementError}</span>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleApplyRefinement}
              className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* AI Suggested Changes Preview */}
      {previewChanges.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/40 space-y-6 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h3 className="text-lg font-bold text-white font-outfit">✨ AI Suggested Changes</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRejectAll}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-colors"
              >
                Reject All
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-3.5 py-2 rounded-xl gradient-button text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
              >
                Accept All Changes
              </button>
            </div>
          </div>

          <div className="space-y-6 divide-y divide-slate-800/60">
            {previewChanges.map((change, cIdx) => {
              const qIndex = change.questionId.startsWith('q')
                ? parseInt(change.questionId.replace('q', '')) - 1
                : -1;
              const origQuestion = qIndex >= 0 && qIndex < questions.length ? questions[qIndex] : null;

              return (
                <div key={cIdx} className={`pt-6 ${cIdx === 0 ? 'pt-0' : ''} space-y-4`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                    <div className="space-y-1">
                      <h4 className="text-white font-extrabold text-sm flex items-center gap-2">
                        {change.questionId.startsWith('new') ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/30">
                            New Question
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase border border-indigo-500/30">
                            Question {qIndex + 1}
                          </span>
                        )}
                        <span className="text-slate-400 font-medium">({change.action})</span>
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                        <span className="font-bold text-indigo-400">Reason:</span> {change.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={() => handleRejectChange(cIdx)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAcceptChange(cIdx)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BEFORE */}
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                      <div className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">BEFORE</div>
                      {origQuestion ? (
                        <>
                          <p className="text-slate-300 text-xs font-semibold leading-relaxed">{origQuestion.text}</p>
                          <div className="space-y-1.5 pt-1">
                            {origQuestion.options.map((opt, oIdx) => {
                              const isCorrect = origQuestion.correctOptions?.includes(oIdx);
                              return (
                                <div
                                  key={oIdx}
                                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between ${
                                    isCorrect
                                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isCorrect && <span className="text-[10px] uppercase font-bold text-emerald-400">Correct</span>}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-slate-500 text-xs italic">Does not exist (New question to be added)</p>
                      )}
                    </div>

                    {/* AFTER */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-indigo-500/20 space-y-3">
                      <div className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">AFTER</div>
                      {change.action === 'deleted' ? (
                        <p className="text-red-400 text-xs italic font-semibold">This question will be deleted.</p>
                      ) : (
                        <>
                          <p className="text-white text-xs font-semibold leading-relaxed">{change.question.text}</p>
                          <div className="space-y-1.5 pt-1">
                            {change.question.options.map((opt, oIdx) => {
                              const isCorrect = change.question.correctOptions?.includes(oIdx);
                              return (
                                <div
                                  key={oIdx}
                                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between ${
                                    isCorrect
                                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-medium'
                                      : 'bg-slate-900/90 border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isCorrect && <span className="text-[10px] uppercase font-bold text-emerald-400">Correct</span>}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question cards */}
      {questions.map((q, index) => (
        <div
          key={q._localId || index}
          className={`glass-panel p-6 rounded-3xl border space-y-4 ${
            q.validationStatus === 'valid' ? 'border-emerald-500/30' : 'border-amber-500/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-indigo-300 text-sm">
                Q{index + 1}
              </span>
              {q.validationStatus === 'valid' ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Needs Review
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => handleMove(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30" title="Move up">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => handleMove(index, 1)} disabled={index === questions.length - 1} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30" title="Move down">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => openEdit(index)} className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              {onRegenerate && aiContext && (
                <button
                  type="button"
                  onClick={() => onRegenerate(index)}
                  disabled={regeneratingIndex === index}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-900/50 text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingIndex === index ? 'animate-spin' : ''}`} /> Regenerate
                </button>
              )}
              {q.history && q.history.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleUndo(index)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-900/50 text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 border border-amber-500/30"
                  title="Undo last AI change"
                >
                  <Undo className="w-3.5 h-3.5" /> Undo
                </button>
              )}
              <button type="button" onClick={() => handleDuplicate(index)} className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              {questions.length > 1 && (
                <button type="button" onClick={() => handleDelete(index)} className="px-2.5 py-1.5 rounded-lg bg-red-950/40 text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          </div>

          {q.validationIssues?.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1">
              {q.validationIssues.map((issue, i) => (
                <p key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {issue}
                </p>
              ))}
            </div>
          )}

          <p className="text-white font-semibold text-base leading-relaxed">{q.text || <span className="text-slate-500 italic">No question text</span>}</p>

          <div className="space-y-2">
            {q.options.map((opt, oIndex) => {
              const isCorrect = q.correctOptions?.includes(oIndex);
              return (
                <div
                  key={oIndex}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${
                    isCorrect ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="w-6 h-6 rounded-md bg-slate-800 text-xs font-bold flex items-center justify-center border border-slate-700">
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                  <span className="flex-1">{opt || <span className="text-slate-500 italic">Empty option</span>}</span>
                  {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              {q.isMultiSelect ? <CheckSquare className="w-3.5 h-3.5 text-purple-400" /> : <CircleDot className="w-3.5 h-3.5 text-indigo-400" />}
              {q.isMultiSelect ? 'Multiple Correct' : 'Single Correct'}
            </span>
            <span>Marks: {q.marks}</span>
            <span>Time: {q.timeLimitSec}s</span>
          </div>

          {q.explanation && (
            <p className="text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span className="text-slate-500 font-semibold">Explanation: </span>{q.explanation}
            </p>
          )}
        </div>
      ))}

      {/* Edit Modal */}
      {editingIndex !== null && editDraft && (
        <QuestionEditModal
          question={editDraft}
          onChange={setEditDraft}
          onSave={saveEdit}
          onClose={() => { setEditingIndex(null); setEditDraft(null); }}
        />
      )}
    </div>
  );
};

const QuestionEditModal = ({ question, onChange, onSave, onClose }) => {
  const updateField = (field, value) => onChange({ ...question, [field]: value });

  const updateOption = (oIndex, value) => {
    const options = [...question.options];
    options[oIndex] = value;
    onChange({ ...question, options });
  };

  const addOption = () => {
    if (question.options.length >= 6) return;
    onChange({ ...question, options: [...question.options, ''] });
  };

  const removeOption = (oIndex) => {
    if (question.options.length <= 2) return;
    const options = question.options.filter((_, i) => i !== oIndex);
    let correctOptions = question.correctOptions.filter((i) => i !== oIndex).map((i) => (i > oIndex ? i - 1 : i));
    if (correctOptions.length === 0) correctOptions = [0];
    onChange({ ...question, options, correctOptions });
  };

  const toggleMulti = () => {
    const isMulti = !question.isMultiSelect;
    let correctOptions = question.correctOptions || [0];
    if (!isMulti && correctOptions.length > 1) correctOptions = [correctOptions[0]];
    onChange({ ...question, isMultiSelect: isMulti, type: isMulti ? 'multiple' : 'single', correctOptions });
  };

  const setCorrect = (oIndex) => {
    if (!question.isMultiSelect) {
      onChange({ ...question, correctOptions: [oIndex] });
    } else {
      const current = question.correctOptions || [];
      if (current.includes(oIndex)) {
        if (current.length > 1) onChange({ ...question, correctOptions: current.filter((i) => i !== oIndex) });
      } else {
        onChange({ ...question, correctOptions: [...current, oIndex] });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border border-white/10 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white">Edit Question</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Question Text</label>
          <textarea rows={2} value={question.text} onChange={(e) => updateField('text', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={toggleMulti} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${question.isMultiSelect ? 'bg-purple-950/80 border-purple-500/80 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
            {question.isMultiSelect ? 'Multiple Correct' : 'Single Correct'}
          </button>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Marks:</label>
            <input type="number" min={1} max={100} value={question.marks} onChange={(e) => updateField('marks', e.target.value)} className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white text-center" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Time (sec):</label>
            <input type="number" min={0} max={600} value={question.timeLimitSec} onChange={(e) => updateField('timeLimitSec', e.target.value)} className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white text-center" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 uppercase">Options</label>
            <button type="button" onClick={addOption} className="text-xs text-indigo-400 font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Option
            </button>
          </div>
          {question.options.map((opt, oIndex) => (
            <div key={oIndex} className="flex items-center gap-2">
              <input type={question.isMultiSelect ? 'checkbox' : 'radio'} checked={question.correctOptions?.includes(oIndex)} onChange={() => setCorrect(oIndex)} className="w-4 h-4 accent-emerald-500" />
              <span className="text-xs font-bold text-slate-400 w-5">{String.fromCharCode(65 + oIndex)}</span>
              <input type="text" value={opt} onChange={(e) => updateOption(oIndex, e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              {question.options.length > 2 && (
                <button type="button" onClick={() => removeOption(oIndex)} className="text-slate-500 hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">Explanation (optional)</label>
          <textarea rows={2} value={question.explanation || ''} onChange={(e) => updateField('explanation', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 text-sm font-bold text-slate-300">Cancel</button>
          <button type="button" onClick={onSave} className="px-5 py-2.5 rounded-xl gradient-button text-sm font-bold text-white">Save Changes</button>
        </div>
      </div>
    </div>
  );
};
