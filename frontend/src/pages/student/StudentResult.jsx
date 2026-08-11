import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import confetti from 'canvas-confetti';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { LeaderboardTable } from '../../components/LeaderboardTable';
import { AnimatedPage } from '../../components/AnimatedPage';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, Home, Sparkles } from 'lucide-react';

export const StudentResult = () => {
  const { id: quizId } = useParams();
  const { user } = useAuth();
  const { socket, joinQuizRoom } = useSocket();

  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultAndLeaderboard();
  }, [quizId]);

  const fetchResultAndLeaderboard = async () => {
    try {
      const quizRes = await API.get(`/quizzes/${quizId}`);
      setQuiz(quizRes.data);

      if (quizRes.data.resultsReleased) {
        const attemptRes = await API.get(`/attempts/my/${quizId}`);
        setAttempt(attemptRes.data);
        if (attemptRes.data?.percentage >= 45) {
          confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
        }
      }

      if (quizRes.data.leaderboardReleased) {
        const leaderboardRes = await API.get(`/attempts/quiz/${quizId}`);
        setLeaderboard(leaderboardRes.data.map((a, i) => ({
          rank: i + 1,
          studentId: a.studentId?._id || a.studentId,
          studentName: a.studentName || 'Student',
          score: a.score,
          totalPossible: a.totalPossibleMarks,
          percentage: a.percentage,
          timeTakenSec: a.totalTimeTakenSec,
          submittedAt: a.submittedAt,
        })));
      }
    } catch (error) {
      console.error('Error loading student result:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !quizId) return;

    joinQuizRoom(quizId);

    socket.on('results_released', fetchResultAndLeaderboard);
    socket.on('leaderboard_released', fetchResultAndLeaderboard);

    return () => {
      socket.off('results_released');
      socket.off('leaderboard_released');
    };
  }, [socket, quizId]);

  if (loading || !quiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-400 text-sm">Calculating final score & rank...</p>
      </div>
    );
  }

  if (!quiz.resultsReleased) {
    return (
      <AnimatedPage>
        <div className="max-w-5xl mx-auto min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 gap-6 w-full">
          <div className="max-w-lg w-full glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold text-white font-outfit">Quiz Submitted</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your answers have been submitted. Please wait for the quiz admin to release the results.
            </p>
            <p className="text-xs text-indigo-300 font-bold">This page will update automatically.</p>
          </div>
          {quiz.leaderboardReleased && (
            <div className="w-full">
              <LeaderboardTable leaderboard={leaderboard} currentUserId={user?.id} />
            </div>
          )}
        </div>
      </AnimatedPage>
    );
  }

  if (!attempt) return null;

  const percentage = attempt.percentage || 0;
  const isPassed = percentage >= 50;

  return (
    <AnimatedPage>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Result Hero Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-6 relative overflow-hidden shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, type: 'spring' }}
            className={`w-24 h-24 rounded-3xl border flex items-center justify-center mx-auto shadow-2xl ${
              isPassed
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
            }`}
          >
            <Trophy className="w-12 h-12" />
          </motion.div>

          <div className="space-y-2">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                isPassed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isPassed ? '🎉 Quiz Completed Successfully!' : '👍 Good Effort! Keep Practicing'}
            </span>

            <h1 className="text-4xl font-black text-white font-outfit tracking-tight">{quiz.title}</h1>
            <p className="text-slate-400 text-sm">Official Result Card for {user?.name}</p>
          </div>

          {/* Score Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-4 border-t border-slate-800">
            <motion.div whileHover={{ scale: 1.03 }} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs uppercase font-bold text-slate-400 block">Your Score</span>
              <span className="text-3xl font-black text-white font-outfit">
                {attempt.score} <span className="text-sm font-normal text-slate-400">/ {attempt.totalPossibleMarks}</span>
              </span>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs uppercase font-bold text-slate-400 block">Percentage</span>
              <span className="text-3xl font-black text-indigo-400 font-outfit">{percentage.toFixed(1)}%</span>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs uppercase font-bold text-slate-400 block">Time Spent</span>
              <span className="text-3xl font-black text-amber-400 font-outfit">{attempt.totalTimeTakenSec}s</span>
            </motion.div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/join"
                className="px-6 py-3 rounded-2xl gradient-button text-sm font-extrabold text-white shadow-lg flex items-center gap-2"
              >
                <Home className="w-4 h-4" /> Join Another Quiz
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Answer Audit Review */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h2 className="text-2xl font-extrabold text-white font-outfit border-b border-slate-800 pb-4">
            Detailed Question Review
          </h2>

          <div className="space-y-6">
            {quiz.questions.map((q, qIdx) => {
              const studentAnsObj = attempt.answers?.find((a) => String(a.questionId) === String(q._id));
              const selectedOptions = studentAnsObj ? studentAnsObj.selectedOptions || [] : [];
              const isCorrect = studentAnsObj ? studentAnsObj.isCorrect : false;

              return (
                <div
                  key={q._id}
                  className={`p-6 rounded-2xl border space-y-4 transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-red-950/20 border-red-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.marks || 1} Marks)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold text-xs flex items-center gap-1 border border-red-500/40">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect (0 Marks)
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Question #{qIdx + 1}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-outfit">{q.text}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {q.options.map((optText, optIdx) => {
                      const isSelectedByStudent = selectedOptions.includes(optIdx);
                      const isActualCorrect = q.correctOptions?.includes(optIdx);

                      let badgeClass = 'bg-slate-900 border-slate-800 text-slate-300';
                      if (isActualCorrect) {
                        badgeClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500/50';
                      } else if (isSelectedByStudent && !isActualCorrect) {
                        badgeClass = 'bg-red-950/80 border-red-500 text-red-200 font-bold ring-1 ring-red-500/50';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${badgeClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                            <span>{optText}</span>
                          </div>

                          {isActualCorrect && (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                              Correct Answer
                            </span>
                          )}
                          {isSelectedByStudent && !isActualCorrect && (
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {quiz.leaderboardReleased ? (
          <div className="space-y-4">
            <LeaderboardTable leaderboard={leaderboard} currentUserId={user?.id} />
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center space-y-2">
            <h2 className="text-lg font-extrabold text-white">Leaderboard Pending</h2>
            <p className="text-sm text-slate-400">The admin has not released the leaderboard yet.</p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};
