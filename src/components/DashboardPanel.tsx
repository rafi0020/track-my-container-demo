import { useDemoStore } from "../store/useDemoStore";

export default function DashboardPanel() {
  const events = useDemoStore((s) => s.events);
  const selectEvent = useDemoStore((s) => s.selectEvent);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-sm text-slate-400">Dashboard View</div>
      <div className="text-lg font-semibold">Real-time Event Feed</div>

      <div className="mt-4 space-y-2">
        {events.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            No events yet. Start the demo to generate fused container movement events.
          </div>
        ) : (
          events.slice(0, 10).map((e) => (
            <button
              key={e.eventId}
              onClick={() => selectEvent(e.eventId)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-left hover:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-base font-semibold text-slate-100">{e.containerNumber}</div>
                  <div className="text-xs text-slate-400">
                    Device {e.deviceId} • {new Date(e.epochMs).toLocaleString()}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div className="font-semibold text-slate-200">
                    {e.integrity.isoStatus.toUpperCase()}
                  </div>
                  <div>{e.correlation.mode === "backend_correlation" ? "Backend correlation" : "Edge bundling"}</div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
                  Conf {e.containerConfidence.toFixed(2)}
                </span>
                <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
                  Corr {e.correlation.success ? "OK" : "MISS"}
                </span>
                {e.telemetry ? (
                  <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
                    {e.telemetry.pickDrop} • h={e.telemetry.heightM.toFixed(1)}m
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
                    No telemetry matched
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
