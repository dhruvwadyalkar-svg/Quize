import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const Timer = ({ serverStartTime, durationSec, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!serverStartTime || !durationSec) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - serverStartTime) / 1000);
      const remaining = Math.max(0, durationSec - elapsed);
      return remaining;
    };

    // Initial sync
    const initialRemaining = calculateRemaining();
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0) {
      if (onTimeUpRef.current) onTimeUpRef.current();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onTimeUpRef.current) onTimeUpRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [serverStartTime, durationSec]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft <= 30;
  const isCritical = timeLeft <= 10;

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300 font-outfit shadow-lg ${
        isCritical
          ? 'bg-red-950/80 border-red-500/80 text-red-300 animate-pulse ring-2 ring-red-500/50'
          : isWarning
          ? 'bg-amber-950/70 border-amber-500/70 text-amber-300'
          : 'bg-slate-900/90 border-slate-700 text-indigo-300'
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
      ) : (
        <Clock className="w-5 h-5 text-indigo-400" />
      )}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 block -mb-1">
          Time Remaining
        </span>
        <span className="text-xl font-bold tracking-tight">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
