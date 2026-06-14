import { Play, Pause, RotateCcw, Flame, Sparkles, Coffee } from "lucide-react";
import { useAppStore } from "../store";
import { useEffect } from "react";

export default function Pomodoro() {
  const { 
    pomodoro, 
    tickPomodoro, 
    togglePomodoroActive, 
    resetPomodoro, 
    setPomodoroMode,
    getTheme 
  } = useAppStore();

  const theme = getTheme();

  // Handle ticking timer intervals safely
  useEffect(() => {
    let intervalId: any = null;
    if (pomodoro.isActive) {
      intervalId = setInterval(() => {
        tickPomodoro();
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pomodoro.isActive, tickPomodoro]);

  const progressTotalSeconds = pomodoro.mode === 'work' ? 25 * 60 : 5 * 60;
  const currentRemainingSeconds = pomodoro.minutes * 60 + pomodoro.seconds;
  const elapsedPercent = ((progressTotalSeconds - currentRemainingSeconds) / progressTotalSeconds) * 100;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-5 text-center relative overflow-hidden">
      {/* Background glow visual */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-10 transition-colors duration-500
        ${pomodoro.mode === 'work' ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
      />

      <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
        <h3 className="text-sm font-sans font-black text-white text-left tracking-tight flex items-center gap-1.5">
          {pomodoro.mode === 'work' ? <Flame className="w-4 h-4 text-orange-400 animate-pulse" /> : <Coffee className="w-4 h-4 text-emerald-400" />}
          {pomodoro.mode === 'work' ? 'Focus Session' : 'Intermission'}
        </h3>
        <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 bg-slate-900/40 text-slate-400 rounded-full py-0.5">
          {pomodoro.completedSessions} sessions done
        </span>
      </div>

      {/* Circle / Countdown section */}
      <div className="relative flex flex-col items-center justify-center py-4 z-10">
        {/* Progress ring or visual slider background */}
        <div className="w-44 h-44 rounded-full border-4 border-white/5 flex flex-col items-center justify-center relative">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="82"
              className="stroke-white/5 stroke-[4] fill-none"
            />
            <circle
              cx="88"
              cy="88"
              r="82"
              className={`stroke-[4] fill-none transition-all duration-300`}
              strokeDasharray={`${2 * Math.PI * 82}`}
              strokeDashoffset={`${2 * Math.PI * 82 * (1 - elapsedPercent / 100)}`}
              strokeLinecap="round"
              stroke={pomodoro.mode === 'work' ? 'url(#pomoGradient)' : '#10b981'}
            />
            {/* SVG Gradients definitions */}
            <defs>
              <linearGradient id="pomoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          <div className="space-y-1 select-none">
            <span role="img" aria-label="timer clock" className="text-4xl font-sans font-black text-white tracking-tighter">
              {String(pomodoro.minutes).padStart(2, '0')}:
              {String(pomodoro.seconds).padStart(2, '0')}
            </span>
            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
              {pomodoro.isActive ? 'Flowing...' : 'Paused'}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Switches */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        <button
          onClick={() => setPomodoroMode('work')}
          className={`py-1.5 rounded-lg text-xs font-sans font-semibold transition-all duration-200
            ${pomodoro.mode === 'work'
              ? `bg-indigo-500/15 text-indigo-400 border border-indigo-500/30`
              : 'text-slate-400 hover:text-white border border-transparent'
            }`}
        >
          Work
        </button>
        <button
          onClick={() => setPomodoroMode('break')}
          className={`py-1.5 rounded-lg text-xs font-sans font-semibold transition-all duration-200
            ${pomodoro.mode === 'break'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white border border-transparent'
            }`}
        >
          Break
        </button>
      </div>

      {/* Controls Button Row */}
      <div className="flex items-center justify-center gap-3 pt-1 relative z-10">
        <button
          onClick={resetPomodoro}
          className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={togglePomodoroActive}
          className={`px-6 py-2.5 rounded-xl font-sans font-bold text-xs text-white shadow-lg shadow-indigo-500/15 transition-all flex items-center gap-2 cursor-pointer
            ${pomodoro.mode === 'work' 
              ? `bg-gradient-to-r ${theme.primaryGradient}` 
              : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
        >
          {pomodoro.isActive ? (
            <>
              <Pause className="w-4.5 h-4.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4.5 h-4.5" />
              Start
            </>
          )}
        </button>
      </div>
    </div>
  );
}
