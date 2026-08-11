import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  'Understanding topic',
  'Creating questions',
  'Validating answers',
  'Checking duplicates',
  'Preparing preview',
];

export const GenerationLoading = ({ message = 'Generating Questions...' }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-extrabold text-white font-outfit">{message}</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Gemini is building your quiz questions. This usually takes a few seconds.
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-3 text-left">
        {STEPS.map((step, index) => {
          const isDone = index < activeStep;
          const isActive = index === activeStep;

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 text-sm ${
                isDone ? 'text-emerald-400' : isActive ? 'text-indigo-300' : 'text-slate-500'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              ) : (
                <span className="w-4 h-4 shrink-0 rounded-full border border-slate-600" />
              )}
              <span>{isDone ? '✓' : isActive ? '…' : '○'} {step}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
