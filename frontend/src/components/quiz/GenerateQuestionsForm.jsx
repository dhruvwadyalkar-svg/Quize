import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

export const GenerateQuestionsForm = ({ onGenerate, loading, defaultTopic = '' }) => {
  const [topic, setTopic] = useState(defaultTopic);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');
  const [type, setType] = useState('mixed');
  const [optionsCount, setOptionsCount] = useState(4);
  const [marks, setMarks] = useState(1);
  const [timeLimit, setTimeLimit] = useState(30);
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }

    onGenerate({
      topic: topic.trim(),
      count: Number(count),
      difficulty,
      type,
      optionsCount: Number(optionsCount),
      marks: Number(marks),
      timeLimit: Number(timeLimit),
      instructions: instructions.trim(),
    });
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Sparkles className="w-6 h-6 text-indigo-400" />
        <div>
          <h3 className="text-xl font-extrabold text-white font-outfit">Generate with Gemini AI</h3>
          <p className="text-xs text-slate-400">Configure your quiz and let Gemini create questions.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Topic *</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Python Programming"
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Number of Questions</label>
            <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Options per Question</label>
            <select value={optionsCount} onChange={(e) => setOptionsCount(e.target.value)} className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500">
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Question Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500">
              <option value="single">Single Correct</option>
              <option value="multiple">Multiple Correct</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Marks</label>
            <input type="number" min={1} max={100} value={marks} onChange={(e) => setMarks(e.target.value)} className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Time per Question (seconds)</label>
            <input type="number" min={0} max={600} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Additional Instructions (Optional)</label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Focus on Python fundamentals, data structures and OOP. Avoid very basic questions."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="gradient-button w-full sm:w-auto px-8 py-3 rounded-xl font-extrabold text-white shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? 'Generating...' : 'Generate Questions'}
        </button>
      </form>
    </div>
  );
};
