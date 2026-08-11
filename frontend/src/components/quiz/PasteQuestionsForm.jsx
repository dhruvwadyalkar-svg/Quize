import React, { useState } from 'react';
import { ClipboardPaste, AlertCircle } from 'lucide-react';

export const PasteQuestionsForm = ({ onAnalyze, loading }) => {
  const [content, setContent] = useState('');
  const [marks, setMarks] = useState(1);
  const [timeLimit, setTimeLimit] = useState(30);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please paste your questions first.');
      return;
    }

    onAnalyze({ content: content.trim(), marks: Number(marks), timeLimit: Number(timeLimit) });
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <ClipboardPaste className="w-6 h-6 text-emerald-400" />
        <div>
          <h3 className="text-xl font-extrabold text-white font-outfit">Paste & Analyze Questions</h3>
          <p className="text-xs text-slate-400">Paste questions from ChatGPT, Claude, Gemini, or any source.</p>
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Paste Questions</label>
          <textarea
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`1. Which keyword is used to define a function in Python?\n\nA) func\nB) define\nC) def\nD) function\n\nAnswer: C\n\n2. Which are mutable in Python?\n\nA) List\nB) Tuple\nC) Dictionary\nD) String\n\nAnswer: A, C`}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Default Marks</label>
            <input type="number" min={1} max={100} value={marks} onChange={(e) => setMarks(e.target.value)} className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Default Time (seconds)</label>
            <input type="number" min={0} max={600} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          <ClipboardPaste className="w-5 h-5" />
          {loading ? 'Analyzing...' : 'Analyze with Gemini'}
        </button>
      </form>
    </div>
  );
};
