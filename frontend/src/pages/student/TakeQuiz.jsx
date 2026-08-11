import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Timer } from '../../components/Timer';
import { AnimatedPage } from '../../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, ArrowLeft, Send, AlertCircle } from 'lucide-react';

export const TakeQuiz = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinQuizRoom } = useSocket();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverStartTime, setServerStartTime] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Map: questionId -> array of selected option indices
  const [answersMap, setAnswersMap] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    fetchQuizAndStart();
  }, [quizId]);

  const fetchQuizAndStart = async () => {
    try {
      const response = await API.get(`/quizzes/${quizId}`);
      setQuiz(response.data);

      const st = response.data.startTime ? new Date(response.data.startTime).getTime() : Date.now();
      setServerStartTime(st);

      const studentDetails = JSON.parse(sessionStorage.getItem(`quiz_student_details_${quizId}`) || 'null');
      if (!studentDetails?.name || !studentDetails?.prn) {
        navigate('/join', { replace: true });
        return;
      }

      // Register the attempt using the identity entered on the join screen.
      await API.post('/attempts/start', {
        quizId,
        studentName: studentDetails.name,
        studentPrn: studentDetails.prn,
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !quizId) return;
    joinQuizRoom(quizId);
  }, [socket, quizId]);

  const handleSelectOption = (questionId, optionIndex, isMulti) => {
    setAnswersMap((prev) => {
      const current = prev[questionId] || [];
      if (!isMulti) {
        return { ...prev, [questionId]: [optionIndex] };
      } else {
        if (current.includes(optionIndex)) {
          return { ...prev, [questionId]: current.filter((i) => i !== optionIndex) };
        } else {
          return { ...prev, [questionId]: [...current, optionIndex] };
        }
      }
    });
  };

  const handleFinalSubmit = async (isAutoSubmitted = false) => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q._id,
        selectedOptions: answersMap[q._id] || [],
        timeTakenSec: 0,
      }));

      await API.post('/attempts/submit', {
        quizId,
        answers: formattedAnswers,
        isAutoSubmitted,
        studentName: JSON.parse(sessionStorage.getItem(`quiz_student_details_${quizId}`) || 'null')?.name,
        studentPrn: JSON.parse(sessionStorage.getItem(`quiz_student_details_${quizId}`) || 'null')?.prn,
      });

      if (socket) {
        socket.emit('student_submitted_event', {
          quizId,
          studentId: user?.id,
          studentName: user?.name,
        });
      }

      navigate(`/student/result/${quizId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setSubmitError(error.response?.data?.message || 'Submission error. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-400 text-sm">Preparing question paper & timer sync...</p>
      </div>
    );
  }

  const currentQ = quiz.questions[currentIndex];
  const isMulti = currentQ?.correctOptions && currentQ.correctOptions.length > 1;
  const answeredCount = Object.keys(answersMap).filter((k) => (answersMap[k] || []).length > 0).length;
  const totalQuestions = quiz.questions.length;
  const durationSec = (quiz.durationMinutes || 15) * 60;

  return (
    <AnimatedPage>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Top Header Bar */}
        <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h1 className="text-xl font-extrabold text-white font-outfit line-clamp-1">{quiz.title}</h1>
            <p className="text-xs text-slate-400">
              Question {currentIndex + 1} of {totalQuestions} • {answeredCount} Answered
            </p>
          </div>

          <Timer
            serverStartTime={serverStartTime}
            durationSec={durationSec}
            onTimeUp={() => handleFinalSubmit(true)}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Palette */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 lg:col-span-1 h-fit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                Question Palette
              </h3>
              <span className="text-xs font-bold text-indigo-400 lg:hidden">
                #{currentIndex + 1} of {totalQuestions}
              </span>
            </div>

            <div className="flex flex-wrap lg:grid lg:grid-cols-5 gap-2 max-h-32 lg:max-h-none overflow-y-auto custom-scrollbar p-1">
              {quiz.questions.map((q, idx) => {
                const isAnswered = (answersMap[q._id] || []).length > 0;
                const isCurrent = idx === currentIndex;

                return (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/30'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </motion.button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex lg:flex-col items-center lg:items-start justify-between text-[11px] sm:text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/30 border border-emerald-500"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-900 border border-slate-800"></span>
                <span>Unanswered ({totalQuestions - answeredCount})</span>
              </div>
            </div>
          </div>

          {/* Question Card Display with AnimatePresence */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 lg:col-span-3 space-y-6 flex flex-col justify-between min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 font-bold text-xs text-indigo-300">
                    Question #{currentIndex + 1}
                  </span>

                  <span className="text-xs font-semibold text-slate-400">
                    Marks: <strong className="text-emerald-400 font-bold">{currentQ.marks || 1}</strong>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed font-outfit">
                  {currentQ.text}
                </h2>

                <div className="space-y-3 pt-2">
                  {currentQ.options.map((optText, optIdx) => {
                    const selectedList = answersMap[currentQ._id] || [];
                    const isSelected = selectedList.includes(optIdx);

                    return (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ._id, optIdx, isMulti)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-indigo-950/70 border-indigo-500 text-indigo-100 ring-2 ring-indigo-500/30 shadow-lg'
                            : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm font-medium leading-normal">{optText}</span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </motion.button>

              {currentIndex < totalQuestions - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl gradient-button text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSubmitModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white shadow-lg flex items-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" /> Submit Quiz
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-8 rounded-3xl max-w-md w-full border border-white/10 space-y-6 text-center shadow-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <Send className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-white font-outfit">Ready to Submit?</h3>
                <p className="text-slate-400 text-sm">
                  You have answered <strong className="text-indigo-400 font-bold">{answeredCount}</strong> out of{' '}
                  <strong className="text-white font-bold">{totalQuestions}</strong> questions.
                </p>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-red-300 text-xs text-left">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
                >
                  Review Answers
                </button>

                <button
                  onClick={() => handleFinalSubmit(false)}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Confirm & Finish'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};
