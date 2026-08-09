import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { AnimatedPage } from '../../components/AnimatedPage';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight, Zap, AlertCircle } from 'lucide-react';

export const JoinQuiz = () => {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();

  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlCode) {
      setJoinCode(urlCode.toUpperCase());
      handleJoinWithCode(urlCode.toUpperCase());
    }
  }, [urlCode]);

  const handleJoinWithCode = async (codeToSubmit) => {
    const code = (codeToSubmit || joinCode).trim().toUpperCase();
    if (!code) {
      setError('Please enter a 6-character quiz join code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await API.get(`/quizzes/code/${code}`);
      const quiz = response.data;

      // Check if student already submitted this quiz
      try {
        const attemptRes = await API.get(`/attempts/my/${quiz._id}`);
        if (attemptRes.data && attemptRes.data.status !== 'in-progress') {
          navigate(`/student/result/${quiz._id}`);
          return;
        }
      } catch (attErr) {
        // No attempt found, proceed
      }

      if (quiz.status === 'live') {
        navigate(`/student/take/${quiz._id}`);
      } else {
        navigate(`/student/waiting/${quiz._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid join code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleJoinWithCode(joinCode);
  };

  return (
    <AnimatedPage className="flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 border border-white/10 text-center space-y-6"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 rounded-2xl gradient-button flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30"
        >
          <KeyRound className="w-8 h-8 text-white animate-pulse" />
        </motion.div>

        <div>
          <h1 className="text-3xl font-extrabold text-white font-outfit tracking-tight">Join Live Quiz</h1>
          <p className="text-slate-400 text-sm mt-1">Enter the 6-character code shared by your quiz host</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-3 text-red-300 text-sm text-left"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              maxLength={6}
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB12CD"
              className="w-full text-center bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl px-4 py-4 text-3xl font-mono font-black tracking-widest text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all uppercase"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading || !joinCode.trim()}
            className="w-full py-4 rounded-2xl gradient-button font-extrabold text-base text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>ENTER QUIZ ROOM</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-xs text-slate-500 pt-2">
          Make sure your host has opened the quiz session before entering.
        </p>
      </motion.div>
    </AnimatedPage>
  );
};
