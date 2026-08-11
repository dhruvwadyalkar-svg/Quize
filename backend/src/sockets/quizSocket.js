import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';

// In-memory store for room tracking: quizId -> Map<socketId, userInfo>
const activeRooms = new Map();

export const setupQuizSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a quiz room
    socket.on('join_quiz_room', async ({ quizId, user }) => {
      if (!quizId || !user) return;

      const roomName = `quiz_${quizId}`;
      socket.join(roomName);
      socket.quizId = quizId;
      socket.userData = user;

      if (!activeRooms.has(quizId)) {
        activeRooms.set(quizId, new Map());
      }

      const roomMap = activeRooms.get(quizId);
      roomMap.set(socket.id, {
        socketId: socket.id,
        userId: user.id,
        name: user.name,
        role: user.role,
        joinedAt: new Date(),
      });

      // Get unique students count & list
      const allParticipants = Array.from(roomMap.values());
      const students = allParticipants.filter((p) => p.role === 'student');

      // Fetch completed attempts for live submission count
      const submittedAttempts = await QuizAttempt.find({ quizId, status: { $ne: 'in-progress' } });

      console.log(`👤 User ${user.name} (${user.role}) joined room ${roomName}. Total students in room: ${students.length}`);

      // Broadcast room update to everyone in room (Admin Live Monitor & Students)
      io.to(roomName).emit('room_users_update', {
        totalJoined: students.length,
        students: students,
        submissionCount: submittedAttempts.length,
      });

      // Send time sync response
      socket.emit('time_sync_response', { serverTime: Date.now() });
    });

    // Admin starts the quiz
    socket.on('start_quiz', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return;

        quiz.status = 'live';
        quiz.startTime = new Date();
        await quiz.save();

        const serverStartTime = quiz.startTime.getTime();
        const durationSec = (quiz.durationMinutes || 15) * 60;
        const roomName = `quiz_${quizId}`;

        console.log(`🚀 Quiz ${quizId} STARTED by admin! Server startTime: ${serverStartTime}`);

        // Broadcast synced quiz start to all connected clients in the room
        io.to(roomName).emit('quiz_started', {
          quizId,
          serverStartTime,
          durationSec,
          perQuestionTimeSec: quiz.perQuestionTimeSec || 0,
          status: 'live',
        });
      } catch (error) {
        console.error('Socket start quiz error:', error);
      }
    });

    // Student notifies submission
    socket.on('student_submitted_event', async ({ quizId, studentId, studentName }) => {
      const roomName = `quiz_${quizId}`;

      // Fetch updated attempts & leaderboard
      const attempts = await QuizAttempt.find({ quizId }).sort({ score: -1, totalTimeTakenSec: 1 });
      const submittedCount = attempts.filter(a => a.status !== 'in-progress').length;

      // Do not send scores over the student-visible socket before the admin releases the leaderboard.
      io.to(roomName).emit('student_submitted_update', {
        studentId,
        studentName,
        submittedCount,
      });
    });

    // Server time ping sync
    socket.on('request_time_sync', () => {
      socket.emit('time_sync_response', { serverTime: Date.now() });
    });

    // Admin ends quiz manually
    socket.on('end_quiz', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return;

        quiz.status = 'ended';
        await quiz.save();

        const roomName = `quiz_${quizId}`;
        io.to(roomName).emit('quiz_ended', {
          quizId,
        });
      } catch (error) {
        console.error('Socket end quiz error:', error);
      }
    });

    // These are notification-only events. API routes above perform the actual admin-authorized release.
    socket.on('results_released', ({ quizId }) => {
      if (quizId) io.to(`quiz_${quizId}`).emit('results_released');
    });

    socket.on('leaderboard_released', ({ quizId }) => {
      if (quizId) io.to(`quiz_${quizId}`).emit('leaderboard_released');
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      const quizId = socket.quizId;
      if (quizId && activeRooms.has(quizId)) {
        const roomMap = activeRooms.get(quizId);
        roomMap.delete(socket.id);
        const allParticipants = Array.from(roomMap.values());
        const students = allParticipants.filter((p) => p.role === 'student');

        const roomName = `quiz_${quizId}`;
        io.to(roomName).emit('room_users_update', {
          totalJoined: students.length,
          students: students,
        });
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
