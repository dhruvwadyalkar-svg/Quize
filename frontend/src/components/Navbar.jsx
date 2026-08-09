import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, LogOut, ShieldCheck, UserCheck, PlusCircle, LayoutDashboard, KeyRound, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3 shadow-xl backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5 sm:gap-3 group">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.08 }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl gradient-button flex items-center justify-center shadow-lg shrink-0"
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
          </motion.div>
          <div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight font-outfit">
              Quizz<span className="gradient-text">Pulse</span>
            </span>
            <span className="hidden xs:block text-[9px] sm:text-[10px] uppercase font-semibold tracking-widest text-slate-400 -mt-1">
              Live Assessment Engine
            </span>
          </div>
        </Link>

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <ThemeSwitcher />

          {user ? (
            <div className="flex items-center gap-3 lg:gap-4">
              {user.role === 'admin' ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-sm font-medium text-slate-200 transition-all border border-slate-700/50"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/create"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl gradient-button text-sm font-semibold text-white shadow-md hover:shadow-indigo-500/25 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Quiz</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/join"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl gradient-button text-sm font-semibold text-white shadow-md hover:shadow-indigo-500/25 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Join Quiz</span>
                </Link>
              )}

              {/* User Profile Badge */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-700/60">
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight line-clamp-1 max-w-[120px]">{user.name}</p>
                  <div className="flex items-center gap-1">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <UserCheck className="w-3 h-3" /> Student
                      </span>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl gradient-button text-sm font-semibold text-white shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Right Controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeSwitcher />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden pt-3 border-t border-slate-800/80 mt-3"
          >
            <div className="flex flex-col space-y-3 pb-2">
              {user ? (
                <>
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          {user.role === 'admin' ? (
                            <span className="text-purple-400 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Admin Host
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> Student Candidate
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>

                  {user.role === 'admin' ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        to="/admin/dashboard"
                        onClick={closeMenu}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                          location.pathname === '/admin/dashboard'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link
                        to="/admin/create"
                        onClick={closeMenu}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                          location.pathname === '/admin/create'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                            : 'gradient-button border-transparent text-white'
                        }`}
                      >
                        <PlusCircle className="w-4 h-4" /> Create Quiz
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to="/join"
                      onClick={closeMenu}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl gradient-button text-sm font-bold text-white shadow-md"
                    >
                      <KeyRound className="w-4 h-4" /> Join Quiz Room
                    </Link>
                  )}
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-1">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="w-full text-center py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="w-full text-center py-2.5 rounded-xl gradient-button text-sm font-bold text-white shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

