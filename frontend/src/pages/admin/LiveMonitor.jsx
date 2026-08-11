import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { LeaderboardTable } from '../../components/LeaderboardTable';
import { Play, Radio, Users, Copy, Check, ArrowLeft, Square, Sparkles, CheckCircle2, Link2, Trophy, ListOrdered } from 'lucide-react';

export const LiveMonitor = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinQuizRoom } = useSocket();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinedStudents, setJoinedStudents] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [status, setStatus] = useState('draft');
  const [releasing, setReleasing] = useState(null);

  useEffect(() => {
    fetchQuizAndAttempts();
  }, [quizId]);

  const fetchQuizAndAttempts = async () => {
    try {
      const quizRes = await API.get(`/quizzes/${quizId}`);
      setQuiz(quizRes.data);
      setStatus(quizRes.data.status);

      const attemptsRes = await API.get(`/attempts/quiz/${quizId}`);
      setLeaderboard(
        attemptsRes.data.map((a, i) => ({
          rank: i + 1,
          studentName: a.studentName || 'Student',
          score: a.score,
          totalPossible: a.totalPossibleMarks,
          percentage: a.percentage,
          timeTakenSec: a.totalTimeTakenSec,
          submittedAt: a.submittedAt,
        }))
      );
      setSubmissionCount(attemptsRes.data.filter((a) => a.status !== 'in-progress').length);
    } catch (error) {
      console.error('Error loading monitor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !quizId) return;

    // Join room
    joinQuizRoom(quizId);

    // Listen for room users update
    socket.on('room_users_update', ({ totalJoined, students, submissionCount: subCount }) => {
      setJoinedStudents(students || []);
      if (subCount !== undefined) setSubmissionCount(subCount);
    });

    // Listen for real-time student submissions
    socket.on('student_submitted_update', ({ submittedCount }) => {
      setSubmissionCount(submittedCount);
      fetchQuizAndAttempts();
    });

    socket.on('quiz_started', ({ status: newStatus }) => {
      setStatus(newStatus || 'live');
    });

    socket.on('quiz_ended', () => {
      setStatus('ended');
      fetchQuizAndAttempts();
    });

    return () => {
      socket.off('room_users_update');
      socket.off('student_submitted_update');
      socket.off('quiz_started');
      socket.off('quiz_ended');
    };
  }, [socket, quizId]);

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleCopyCode = () => {
    if (!quiz?.joinCode) return;
    copyToClipboard(quiz.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    if (!quiz?.joinCode) return;
    const link = `${window.location.origin}/join/${quiz.joinCode}`;
    copyToClipboard(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleStartQuiz = () => {
    if (!socket) return;
    socket.emit('start_quiz', { quizId });
    setStatus('live');
  };

  const handleEndQuiz = () => {
    if (!socket) return;
    if (!window.confirm('Are you sure you want to end this live quiz for all students?')) return;
    socket.emit('end_quiz', { quizId });
    setStatus('ended');
  };

  const handleRelease = async (type) => {
    setReleasing(type);
    try {
      const endpoint = type === 'results' ? 'release-results' : 'release-leaderboard';
      const response = await API.patch(`/quizzes/${quizId}/${endpoint}`);
      setQuiz(response.data);
      socket?.emit(type === 'results' ? 'results_released' : 'leaderboard_released', { quizId });
    } catch (error) {
      window.alert(error.response?.data?.message || `Unable to release ${type}.`);
    } finally {
      setReleasing(null);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-400 text-sm">Connecting to Live Monitor...</p>
      </div>
    );
  }

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

        <span
          className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg ${
            status === 'live'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
              : status === 'ended'
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{status === 'live' ? '🟢 LIVE SESSION ACTIVE' : status === 'ended' ? '🏁 SESSION ENDED' : '⏳ WAITING ROOM OPEN'}</span>
        </span>
      </div>

      {/* Main Control Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white font-outfit tracking-tight">{quiz.title}</h1>
            <p className="text-slate-400 text-sm">{quiz.description || 'No description provided.'}</p>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
              <span>Duration: {quiz.durationMinutes} mins</span>
              <span>•</span>
              <span>Questions: {quiz.questions?.length || 0}</span>
              <span>•</span>
              <span>Total Marks: {quiz.totalMarks}</span>
            </div>
          </div>

          {/* Join Code & Copy Actions */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3 shrink-0 w-full lg:w-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">
              Quiz Join Code & Link
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-2xl font-black text-amber-400 tracking-wider bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500/30">
                {quiz.joinCode}
              </span>

              <button
                onClick={handleCopyCode}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl gradient-button font-bold text-xs text-white shadow-md flex items-center gap-1.5 hover:scale-105 transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Link2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">Students in Room</p>
              <p className="text-2xl font-black text-white font-outfit">{joinedStudents.length}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">Live Submissions</p>
              <p className="text-2xl font-black text-emerald-400 font-outfit">{submissionCount}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {status !== 'live' && status !== 'ended' && (
              <button
                onClick={handleStartQuiz}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-105 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START LIVE QUIZ NOW</span>
              </button>
            )}

            {status === 'live' && (
              <button
                onClick={handleEndQuiz}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-base shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 hover:scale-105 transition-all"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>END QUIZ EARLY</span>
              </button>
            )}

            {status === 'ended' && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleRelease('results')}
                  disabled={quiz.resultsReleased || releasing !== null}
                  className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Trophy className="w-4 h-4" /> {quiz.resultsReleased ? 'Results Released' : releasing === 'results' ? 'Releasing...' : 'Show Results'}
                </button>
                <button
                  onClick={() => handleRelease('leaderboard')}
                  disabled={quiz.leaderboardReleased || releasing !== null}
                  className="py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <ListOrdered className="w-4 h-4" /> {quiz.leaderboardReleased ? 'Leaderboard Released' : releasing === 'leaderboard' ? 'Releasing...' : 'Show Leaderboard'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Connected Feed */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Connected Students Feed</h3>
          <div className="flex flex-wrap gap-2 min-h-[48px] p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            {joinedStudents.length === 0 ? (
              <p className="text-xs text-slate-500 italic flex items-center gap-2 py-1">
                <Users className="w-4 h-4" /> Waiting for students to join via code {quiz.joinCode}...
              </p>
            ) : (
              joinedStudents.map((st, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs font-semibold text-indigo-200 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                  <span>{st.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        <LeaderboardTable leaderboard={leaderboard} />
      </div>
    </div>
  );
};
