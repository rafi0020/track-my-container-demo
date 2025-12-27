import { useDemoStore } from "../store/useDemoStore";

interface Props {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export default function PlaybackControls({ onStart, onStop, onReset }: Props) {
  const isRunning = useDemoStore((s) => s.isRunning);
  const pipeline = useDemoStore((s) => s.pipeline);

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-white hover:bg-emerald-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Demo
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-lg font-semibold text-white hover:bg-rose-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          )}

          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Timer */}
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase">Elapsed</div>
            <div className="text-2xl font-mono font-bold text-white">{formatTime(pipeline.nowMs)}</div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
            <span className={`text-sm font-medium ${isRunning ? "text-emerald-400" : "text-slate-500"}`}>
              {isRunning ? "Running" : "Stopped"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
