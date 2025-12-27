import { useMemo } from "react";
import { useDemoStore } from "../store/useDemoStore";

export default function ContainerDetailModal() {
  const events = useDemoStore((s) => s.events);
  const selectedId = useDemoStore((s) => s.selectedEventId);
  const selectEvent = useDemoStore((s) => s.selectEvent);

  const evt = useMemo(() => events.find((e) => e.eventId === selectedId), [events, selectedId]);

  if (!evt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-slate-400">Container Detail</div>
            <div className="font-mono text-2xl font-semibold">{evt.containerNumber}</div>
            <div className="text-xs text-slate-400">
              Event {evt.eventId} • Dedup {evt.dedupKey}
            </div>
          </div>
          <button
            onClick={() => selectEvent(undefined)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="text-sm font-semibold">Fused Record</div>
            <pre className="mt-2 max-h-[320px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">
{JSON.stringify(
  {
    deviceId: evt.deviceId,
    tsUtcIso: evt.tsUtcIso,
    containerNumber: evt.containerNumber,
    confidence: evt.containerConfidence,
    integrity: evt.integrity,
    correlation: evt.correlation,
    telemetry: evt.telemetry
  },
  null,
  2
)}
            </pre>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="text-sm font-semibold">Artifacts</div>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {(["pairedCrop", "v2hStrip", "verticalCrop", "ownerCrop", "numberCrop"] as const).map((k) => {
                const a = evt.artifacts[k];
                return (
                  <div key={k} className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                    <div className="text-xs text-slate-400">{k}</div>
                    <div className="mt-1 aspect-[16/6] overflow-hidden rounded-md border border-slate-800 bg-slate-900">
                      {a?.dataUrl ? (
                        <img src={a.dataUrl} alt={k} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">—</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Note: This is a portfolio-grade simulation demonstrating the real-world pipeline behavior (RTSP → OBB detection → crops → V2H → OCR → ISO validation → fusion).
        </div>
      </div>
    </div>
  );
}
