import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Radio, Users, Clock, ShieldCheck, Sparkles } from 'lucide-react';

export const WaitingRoom = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinQuizRoom } = useSocket();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinedStudents, setJoinedStudents] = useState([]);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await API.get(`/quizzes/${quizId}`);
      setQuiz(response.data);

      if (response.data.status === 'live') {
        navigate(`/student/take/${quizId}`);
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !quizId) return;

    // Join room
    joinQuizRoom(quizId);

    // Room members update
    socket.on('room_users_update', ({ students }) => {
      setJoinedStudents(students || []);
    });

    // Real-time broadcast signal from host to start test!
    socket.on('quiz_started', () => {
      console.log('⚡ Received quiz_started event! Navigating to test taking UI...');
      navigate(`/student/take/${quizId}`);
    });

    return () => {
      socket.off('room_users_update');
      socket.off('quiz_started');
    };
  }, [socket, quizId]);

  if (loading || !quiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-400 text-sm">Entering waiting lobby...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-6 relative overflow-hidden shadow-2xl">
        {/* Glowing background circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto shadow-xl">
          <Radio className="w-10 h-10 text-indigo-400 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-wider border border-amber-500/30">
            ⏳ Waiting Room Open
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">{quiz.title}</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {quiz.description || 'Get ready! The quiz host will launch the session shortly.'}
          </p>
        </div>

        {/* Quiz Specs Summary */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto py-4 border-y border-slate-800">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Duration</span>
            <span className="text-lg font-bold text-amber-400">{quiz.durationMinutes} Minutes</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions Count</span>
            <span className="text-lg font-bold text-indigo-400">{quiz.questions?.length || 0} Questions</span>
          </div>
        </div>

        {/* Joined Peers List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Connected Classmates ({joinedStudents.length})</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto min-h-[50px] p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            {joinedStudents.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Connected to room...</span>
            ) : (
              joinedStudents.map((st, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span>{st.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 animate-pulse">
          Please keep this tab open. The test will begin automatically when the host clicks "Start".
        </p>
      </div>
    </div>
  );
};
