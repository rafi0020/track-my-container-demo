import { useMemo } from "react";
import { useDemoStore } from "../store/useDemoStore";
import { DemoToggles, SimSpeed } from "../sim/types";

function ToggleRow(props: { label: string; desc: string; k: keyof DemoToggles }) {
  const toggles = useDemoStore((s) => s.toggles);
  const setToggle = useDemoStore((s) => s.setToggle);

  return (
    <label className="flex items-start justify-between gap-3 py-2">
      <div>
        <div className="text-sm font-medium">{props.label}</div>
        <div className="text-xs text-slate-400">{props.desc}</div>
      </div>
      <input
        type="checkbox"
        checked={toggles[props.k]}
        onChange={(e) => setToggle(props.k, e.target.checked)}
        className="mt-1 h-4 w-4 accent-slate-100"
      />
    </label>
  );
}

export default function ControlsBar(props: {
  onStart: () => void;
  onStop: () => void;
  onStep: () => void;
  onReset: () => void;
}) {
  const isRunning = useDemoStore((s) => s.isRunning);
  const stepMode = useDemoStore((s) => s.stepMode);
  const setStepMode = useDemoStore((s) => s.setStepMode);
  const speed = useDemoStore((s) => s.speed);
  const setSpeed = useDemoStore((s) => s.setSpeed);

  const speedOptions: SimSpeed[] = useMemo(() => [0.5, 1, 2, 4], []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button onClick={props.onStart} className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
              Start
            </button>
          ) : (
            <button onClick={props.onStop} className="rounded-lg bg-rose-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-300">
              Stop
            </button>
          )}

          <button
            onClick={props.onReset}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold hover:bg-slate-900"
          >
            Reset
          </button>

          <div className="ml-2 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={stepMode}
                onChange={(e) => setStepMode(e.target.checked)}
                className="h-4 w-4 accent-slate-100"
              />
              Step mode
            </label>
            <button
              onClick={props.onStep}
              disabled={!stepMode}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-slate-900"
            >
              Step
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-400">Speed</div>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value) as SimSpeed)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            title="Simulation speed"
          >
            {speedOptions.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        <ToggleRow label="RTSP Instability" desc="Freeze/jitter/drops; queueing + smoothing visible in logs" k="rtspInstability" />
        <ToggleRow label="Fisheye Distortion" desc="Visual proxy of lens distortion; undistort assumed in real system" k="fisheyeDistortion" />
        <ToggleRow label="Vertical ID Cases" desc="Routes through ver_to_hor reconstruction path" k="verticalId" />
        <ToggleRow label="Night Glare" desc="Overexposure/glare; mitigation shown in scenario narrative" k="glareNight" />
        <ToggleRow label="Faded/Damaged Text" desc="OCR misreads increase; ISO correction becomes critical" k="fadedText" />
        <ToggleRow label="Operator Mistakes" desc="Tilt/long holds; dedup suppression visible" k="operatorMistakes" />
        <ToggleRow label="Gate-Side Issues" desc="Weak LAN/power; retry and gaps; correlation window stress" k="gateSideIssues" />
        <ToggleRow label="Backend Correlation Mode" desc="On: ±3s telemetry match. Off: edge bundling snapshot." k="correlationModeBackend" />
      </div>
    </div>
  );
}
