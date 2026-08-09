import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { LeaderboardTable } from '../../components/LeaderboardTable';
import { Download, ArrowLeft, BarChart3, Users, Award, Clock, CheckCircle2, XCircle, FileSpreadsheet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const QuizResults = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [quizId]);

  const fetchResults = async () => {
    try {
      const [quizRes, attemptsRes] = await Promise.all([
        API.get(`/quizzes/${quizId}`),
        API.get(`/attempts/quiz/${quizId}`),
      ]);

      setQuiz(quizRes.data);
      setAttempts(attemptsRes.data);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await API.get(`/quizzes/${quizId}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quiz_results_${quiz?.joinCode || 'export'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-400 text-sm">Loading quiz analytics & scores...</p>
      </div>
    );
  }

  // Calculate analytics
  const totalSubmissions = attempts.length;
  const avgScore = totalSubmissions > 0
    ? (attempts.reduce((acc, a) => acc + a.score, 0) / totalSubmissions).toFixed(1)
    : 0;
  const avgPercentage = totalSubmissions > 0
    ? (attempts.reduce((acc, a) => acc + a.percentage, 0) / totalSubmissions).toFixed(1)
    : 0;
  const highestScore = totalSubmissions > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;

  // Score distribution data for chart
  const scoreBins = [
    { range: '0-25%', count: 0, color: '#f87171' },
    { range: '26-50%', count: 0, color: '#fbbf24' },
    { range: '51-75%', count: 0, color: '#60a5fa' },
    { range: '76-100%', count: 0, color: '#34d399' },
  ];

  attempts.forEach((a) => {
    const p = a.percentage || 0;
    if (p <= 25) scoreBins[0].count++;
    else if (p <= 50) scoreBins[1].count++;
    else if (p <= 75) scoreBins[2].count++;
    else scoreBins[3].count++;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Quiz Overview Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
              Quiz Performance Analytics
            </span>
            <h1 className="text-3xl font-extrabold text-white font-outfit mt-1">{quiz.title}</h1>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800 font-mono text-sm">
            <span className="text-slate-400">Join Code:</span>
            <span className="font-extrabold text-amber-400">{quiz.joinCode}</span>
          </div>
        </div>

        {/* Quick Analytics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs uppercase font-bold text-slate-400 block">Total Submissions</span>
            <span className="text-2xl font-black text-white font-outfit">{totalSubmissions}</span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs uppercase font-bold text-slate-400 block">Avg Percentage</span>
            <span className="text-2xl font-black text-indigo-400 font-outfit">{avgPercentage}%</span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs uppercase font-bold text-slate-400 block">Highest Score</span>
            <span className="text-2xl font-black text-emerald-400 font-outfit">
              {highestScore} / {quiz.totalMarks}
            </span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs uppercase font-bold text-slate-400 block">Average Score</span>
            <span className="text-2xl font-black text-amber-400 font-outfit">
              {avgScore} / {quiz.totalMarks}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 lg:col-span-1 space-y-4">
          <h3 className="font-bold text-lg text-white font-outfit flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" /> Score Distribution
          </h3>
          <p className="text-xs text-slate-400">Student percentage range distribution</p>

          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBins}>
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151c2c', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {scoreBins.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <LeaderboardTable leaderboard={attempts} />
        </div>
      </div>
    </div>
  );
};
