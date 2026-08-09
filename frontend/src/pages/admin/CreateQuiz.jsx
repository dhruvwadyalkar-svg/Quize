import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { Plus, Trash2, CheckCircle2, Clock, Award, HelpCircle, ArrowLeft, Save, AlertCircle, CheckSquare, CircleDot } from 'lucide-react';

export const CreateQuiz = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [perQuestionTimeSec, setPerQuestionTimeSec] = useState(0);

  const [questions, setQuestions] = useState([
    {
      text: '',
      options: ['', '', '', ''],
      correctOptions: [0], // default option A is correct
      isMultiSelect: false,
      marks: 1,
      timeLimitSec: 0,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', '', '', ''],
        correctOptions: [0],
        isMultiSelect: false,
        marks: 1,
        timeLimitSec: 0,
      },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleToggleMultiSelect = (qIndex) => {
    const updated = [...questions];
    const isMulti = !updated[qIndex].isMultiSelect;
    updated[qIndex].isMultiSelect = isMulti;
    if (!isMulti && updated[qIndex].correctOptions.length > 1) {
      updated[qIndex].correctOptions = [updated[qIndex].correctOptions[0]];
    }
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length >= 6) return;
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) return;
    updated[qIndex].options.splice(oIndex, 1);
    updated[qIndex].correctOptions = updated[qIndex].correctOptions
      .filter((idx) => idx !== oIndex)
      .map((idx) => (idx > oIndex ? idx - 1 : idx));
    if (updated[qIndex].correctOptions.length === 0) {
      updated[qIndex].correctOptions = [0];
    }
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex, oIndex) => {
    const updated = [...questions];
    const isMulti = updated[qIndex].isMultiSelect;
    let current = updated[qIndex].correctOptions || [];

    if (!isMulti) {
      updated[qIndex].correctOptions = [oIndex];
    } else {
      if (current.includes(oIndex)) {
        if (current.length > 1) {
          updated[qIndex].correctOptions = current.filter((i) => i !== oIndex);
        }
      } else {
        updated[qIndex].correctOptions = [...current, oIndex];
      }
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a quiz title.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question #${i + 1} statement cannot be empty.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty.`);
          return;
        }
      }
      if (!q.correctOptions || q.correctOptions.length === 0) {
        setError(`Question #${i + 1} must have at least one correct answer selected.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await API.post('/quizzes', {
        title,
        description,
        durationMinutes: Number(durationMinutes),
        perQuestionTimeSec: Number(perQuestionTimeSec),
        questions,
      });

      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz.');
    } finally {
      setSubmitting(false);
    }
  };

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

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-3 text-red-300 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-white/10">
          <h2 className="text-2xl font-extrabold text-white font-outfit border-b border-slate-800 pb-4">
            1. Quiz General Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Quiz Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. JavaScript & Frontend Architecture Quiz"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Description / Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief instructions for students..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
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
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 transition-all"
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
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions Builder */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-white font-outfit">
              2. Add Questions <span className="text-indigo-400">({questions.length})</span>
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 rounded-xl gradient-button font-bold text-xs text-white shadow-md flex items-center gap-1.5 hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 relative"
            >
              {/* Question Header & Type Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-indigo-300 text-sm shrink-0">
                    #{qIndex + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-white">Question Statement</h3>
                    <p className="text-xs text-slate-400">Select the correct option below</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Single vs Multi-select mode toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleMultiSelect(qIndex)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      q.isMultiSelect
                        ? 'bg-purple-950/80 border-purple-500/80 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {q.isMultiSelect ? <CheckSquare className="w-3.5 h-3.5 text-purple-400" /> : <CircleDot className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{q.isMultiSelect ? 'Multiple Correct' : 'Single Correct'}</span>
                  </button>

                  {/* Marks input */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-400">Marks:</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={q.marks}
                      onChange={(e) => handleQuestionChange(qIndex, 'marks', e.target.value)}
                      className="w-14 sm:w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-sm text-emerald-400"
                    />
                  </div>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Question Statement Input */}
              <div>
                <input
                  type="text"
                  required
                  value={q.text}
                  onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                  placeholder={`e.g. What is the output of console.log(typeof NaN)?`}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-base"
                />
              </div>

              {/* Options Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      Options & Correct Answer Selection
                    </label>
                    <span className="text-xs text-slate-400">(Click radio/checkbox to set correct answer)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                </div>

                <div className="space-y-2.5">
                  {q.options.map((opt, oIndex) => {
                    const isCorrect = q.correctOptions?.includes(oIndex);

                    return (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-lg'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        {/* Radio / Checkbox Input for explicitly choosing correct answer */}
                        <label className="flex items-center gap-2.5 cursor-pointer shrink-0">
                          <input
                            type={q.isMultiSelect ? 'checkbox' : 'radio'}
                            name={`correct_${qIndex}`}
                            checked={isCorrect}
                            onChange={() => handleSetCorrectOption(qIndex, oIndex)}
                            className="w-5 h-5 accent-emerald-500 cursor-pointer"
                          />
                          <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-700">
                            {String.fromCharCode(65 + oIndex)}
                          </span>
                        </label>

                        {/* Option Text Input */}
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium"
                        />

                        {/* Correct Answer Badge Indicator */}
                        {isCorrect && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Correct Answer</span>
                          </span>
                        )}

                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(qIndex, oIndex)}
                            className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                            title="Delete Option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-sm text-slate-300 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="gradient-button px-8 py-3.5 rounded-xl font-extrabold text-white shadow-xl shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-all"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save & Publish Quiz
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
