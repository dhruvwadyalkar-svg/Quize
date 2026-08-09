import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { AnimatedPage } from '../../components/AnimatedPage';
import { motion } from 'framer-motion';
import { Plus, Play, BarChart2, Trash2, Copy, Check, Users, Clock, HelpCircle, Radio, Search, Sparkles } from 'lucide-react';

export const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await API.get('/quizzes/admin/my');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching admin quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/join/${code}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All student submissions will be permanently removed.')) return;
    try {
      await API.delete(`/quizzes/${id}`);
      setQuizzes(quizzes.filter((q) => q._id !== id));
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const filteredQuizzes = quizzes.filter(
    (q) => q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.joinCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeLiveCount = quizzes.filter((q) => q.status === 'live').length;
  const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Header Banner */}
        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/10">
          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Host Control Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-outfit">
              Quiz Management <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Create interactive multiple-choice tests, launch live real-time sessions, track student answers, and export leaderboard analytics.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/admin/create"
              className="gradient-button px-6 py-3.5 rounded-2xl font-bold text-white shadow-xl shadow-indigo-500/25 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Quiz</span>
            </Link>
          </motion.div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <motion.div
            whileHover={{ y: -4 }}
            className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Quizzes</p>
              <p className="text-2xl font-extrabold text-white font-outfit">{quizzes.length}</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Live Active Now</p>
              <p className="text-2xl font-extrabold text-emerald-400 font-outfit">{activeLiveCount}</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Questions</p>
              <p className="text-2xl font-extrabold text-white font-outfit">{totalQuestions}</p>
            </div>
          </motion.div>
        </div>

        {/* Search & Quiz List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              Your Quizzes <span className="text-xs text-slate-400 font-normal">({filteredQuizzes.length})</span>
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title or join code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="glass-panel p-12 text-center rounded-2xl">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-400 text-sm">Loading your quizzes...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
                <HelpCircle className="w-8 h-8" />
              </div>
              <p className="text-slate-300 font-semibold text-lg">No quizzes found</p>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                You haven't created any quizzes yet. Click the button below to build your first live quiz.
              </p>
              <Link
                to="/admin/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-button text-sm font-bold text-white shadow-lg"
              >
                <Plus className="w-4 h-4" /> Create First Quiz
              </Link>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredQuizzes.map((quiz) => (
                <motion.div
                  key={quiz._id}
                  variants={itemVariants}
                  whileHover={{ y: -6, borderColor: 'rgba(99, 102, 241, 0.4)' }}
                  className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-5 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          quiz.status === 'live'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                            : quiz.status === 'ended'
                            ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {quiz.status === 'live' ? '🟢 LIVE' : quiz.status === 'ended' ? '🏁 Ended' : '📝 Draft'}
                      </span>

                      <button
                        onClick={() => handleCopyLink(quiz.joinCode)}
                        title="Copy Shareable Link"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold text-amber-400 hover:bg-slate-800 transition-colors"
                      >
                        <span>CODE: {quiz.joinCode}</span>
                        {copiedCode === quiz.joinCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-xl text-white group-hover:text-indigo-300 transition-colors font-outfit line-clamp-1">
                        {quiz.title}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{quiz.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{quiz.questions?.length || 0} Questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{quiz.durationMinutes} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/monitor/${quiz._id}`}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Live Monitor</span>
                      </Link>

                      <Link
                        to={`/admin/results/${quiz._id}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Results</span>
                      </Link>
                    </div>

                    <button
                      onClick={() => handleDelete(quiz._id)}
                      title="Delete Quiz"
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};
