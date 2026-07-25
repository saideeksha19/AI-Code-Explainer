import { motion } from 'motion/react';
import { Clock, AlertTriangle, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutModal({
  isOpen,
  secondsRemaining,
  onExtend,
  onLogout
}: SessionTimeoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px]"
      />

      {/* Main Alert Container */}
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-950/50 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 flex flex-col p-6 text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 animate-bounce">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Security Alert: Session Expiring
        </h3>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
          Due to inactivity, your secure credentials will expire shortly. For security reasons, you will be logged out in:
        </p>

        {/* Big visual countdown */}
        <div className="my-5 py-3 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/10 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-red-600 dark:text-red-400 font-mono tracking-wider">
            0:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
          </span>
          <span className="text-[9px] uppercase font-bold text-red-500 mt-1 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 animate-spin" />
            Seconds Remaining
          </span>
        </div>

        <p className="text-[10px] text-zinc-400 italic mb-5 leading-relaxed">
          Extending your session updates your session JWT tokens.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          
          <button
            onClick={onExtend}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-violet-500/10"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Keep Logged In</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
