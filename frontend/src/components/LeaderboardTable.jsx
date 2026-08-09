import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Clock, Award, CheckCircle2 } from 'lucide-react';

export const LeaderboardTable = ({ leaderboard, currentUserId }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 text-center rounded-2xl"
      >
        <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No submission records yet. Be the first to finish!</p>
      </motion.div>
    );
  }

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <span className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-extrabold shadow-lg shadow-amber-500/20">
            🥇 1
          </span>
        );
      case 2:
        return (
          <span className="w-8 h-8 rounded-full bg-slate-300/20 border border-slate-300/50 flex items-center justify-center text-slate-200 font-extrabold shadow-lg">
            🥈 2
          </span>
        );
      case 3:
        return (
          <span className="w-8 h-8 rounded-full bg-amber-700/20 border border-amber-600/50 flex items-center justify-center text-amber-500 font-extrabold shadow-lg">
            🥉 3
          </span>
        );
      default:
        return (
          <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm">
            #{rank}
          </span>
        );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10"
    >
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-outfit">Live Leaderboard</h3>
            <p className="text-xs text-slate-400">Auto-ranked by Score • Tie-breaker by Time Taken</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
          {leaderboard.length} Participated
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-950/40">
              <th className="py-3.5 px-4 sm:px-6">Rank</th>
              <th className="py-3.5 px-4 sm:px-6">Student</th>
              <th className="py-3.5 px-4 sm:px-6">Score</th>
              <th className="py-3.5 px-4 sm:px-6">Percentage</th>
              <th className="py-3.5 px-4 sm:px-6">Time Taken</th>
            </tr>
          </thead>
          <motion.tbody
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-slate-800/60"
          >
            {leaderboard.map((item, index) => {
              const rank = item.rank || index + 1;
              const isCurrentUser = currentUserId && (item.studentId === currentUserId || item.userId === currentUserId);

              return (
                <motion.tr
                  key={index}
                  variants={itemVariants}
                  whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
                  className={`transition-colors ${
                    isCurrentUser
                      ? 'bg-indigo-950/40 text-indigo-100 font-semibold'
                      : 'text-slate-200'
                  }`}
                >
                  <td className="py-4 px-4 sm:px-6 font-bold">{getRankBadge(rank)}</td>
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {item.studentName || item.name || 'Anonymous Student'}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{item.score}</span>
                      <span className="text-slate-500 text-xs font-normal">/ {item.totalPossible || item.totalMarks || '-'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {typeof item.percentage === 'number' ? `${item.percentage.toFixed(1)}%` : item.percentage || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-300">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.timeTakenSec || item.totalTimeTakenSec || 0} seconds</span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
    </motion.div>
  );
};
