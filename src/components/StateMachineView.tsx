import { useDemoStore } from "../store/useDemoStore";

const STATES = ["Idle", "Candidate", "OCR_Processing", "Validated", "Corrected", "Sent", "Correlated", "Archived", "Rejected", "Dropped", "Error"] as const;

export default function StateMachineView() {
  const state = useDemoStore((s) => s.pipeline.state);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-sm text-slate-400">State Machine</div>
      <div className="text-lg font-semibold">Container Event Lifecycle</div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATES.map((st) => {
          const active = st === state;
          return (
            <div
              key={st}
              className={[
                "rounded-full border px-3 py-1 text-sm",
                active ? "border-slate-200/40 bg-slate-100/10 text-slate-100" : "border-slate-800 bg-slate-950 text-slate-400"
              ].join(" ")}
            >
              {st}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-slate-400">
        In the real deployment: state transitions are driven by detection confirmation windows, dedup logic, and backpressure between modules.
        In this demo: the engine illustrates the same lifecycle deterministically with scenario-controlled faults.
      </div>
    </div>
  );
}
