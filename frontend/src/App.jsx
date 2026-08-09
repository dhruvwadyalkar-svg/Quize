import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CreateQuiz } from './pages/admin/CreateQuiz';
import { LiveMonitor } from './pages/admin/LiveMonitor';
import { QuizResults } from './pages/admin/QuizResults';

import { JoinQuiz } from './pages/student/JoinQuiz';
import { WaitingRoom } from './pages/student/WaitingRoom';
import { TakeQuiz } from './pages/student/TakeQuiz';
import { StudentResult } from './pages/student/StudentResult';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/join" replace />;
};

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col font-sans transition-colors duration-500">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public Auth Routes */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Admin Only Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/create" element={<CreateQuiz />} />
                    <Route path="/admin/monitor/:id" element={<LiveMonitor />} />
                    <Route path="/admin/results/:id" element={<QuizResults />} />
                  </Route>

                  {/* Student Only Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                    <Route path="/join" element={<JoinQuiz />} />
                    <Route path="/join/:code" element={<JoinQuiz />} />
                    <Route path="/student/waiting/:id" element={<WaitingRoom />} />
                    <Route path="/student/take/:id" element={<TakeQuiz />} />
                    <Route path="/student/result/:id" element={<StudentResult />} />
                  </Route>

                  {/* Fallback Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
