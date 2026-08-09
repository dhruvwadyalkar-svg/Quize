import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatedPage } from '../components/AnimatedPage';
import { motion } from 'framer-motion';
import { Zap, User, Mail, Lock, ShieldCheck, UserCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await register(name, email, password, role);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/join');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage className="flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative z-10 border border-white/10"
      >
        <div className="text-center mb-6">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-2xl gradient-button flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30"
          >
            <Zap className="w-8 h-8 text-white animate-pulse" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">Join QuizzPulse to create or participate in live quizzes</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-3 text-red-300 text-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Role Selection Tabs */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-3 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                role === 'student'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Student</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setRole('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                role === 'admin'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Host</span>
            </motion.button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl gradient-button font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in here
          </Link>
        </div>
      </motion.div>
    </AnimatedPage>
  );
};
