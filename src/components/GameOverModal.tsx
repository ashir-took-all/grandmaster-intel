import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, RotateCcw, Home, BarChart3, Clock } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  type: 'VICTORY' | 'DEFEAT';
  stats: {
    turnsTaken: number;
    finalStability: number;
    finalScore: number;
  };
  onRestart: () => void;
  onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  type,
  stats,
  onRestart,
  onExit,
}) => {
  if (!isOpen) return null;

  const isVictory = type === 'VICTORY';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-8 overflow-hidden shadow-2xl"
        >
          {/* Background Glow */}
          <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[100px] opacity-20 ${isVictory ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20 ${isVictory ? 'bg-emerald-500' : 'bg-red-500'}`} />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.2 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                isVictory ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              } border border-white/10`}
            >
              {isVictory ? <Trophy size={40} /> : <Skull size={40} />}
            </motion.div>

            {/* Title */}
            <h2 className={`text-3xl font-black uppercase tracking-tighter mb-2 ${isVictory ? 'text-emerald-400' : 'text-red-400'}`}>
              {isVictory ? 'MISSION ACCOMPLISHED' : 'OPERATION FAILED'}
            </h2>
            <p className="text-white/60 text-sm mb-8 font-medium">
              {isVictory 
                ? 'The Global Grid is under your control.' 
                : 'The Command Center has been compromised.'}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest mb-1">
                  <Clock size={12} />
                  <span>Turns Taken</span>
                </div>
                <span className="text-2xl font-mono font-bold text-white">{stats.turnsTaken}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest mb-1">
                  <BarChart3 size={12} />
                  <span>Final Stability</span>
                </div>
                <span className="text-2xl font-mono font-bold text-white">{stats.finalStability}%</span>
              </div>
            </div>

            {/* Score Display */}
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 mb-8 flex flex-col items-center">
              <span className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Final Strategic Score</span>
              <span className={`text-4xl font-black tracking-tighter ${isVictory ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.finalScore.toLocaleString()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full">
              <button
                onClick={onRestart}
                className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Re-Initialize
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Home size={16} />
                Command Center
              </button>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-widest">
              Session data synchronized with Global Intelligence Database
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
