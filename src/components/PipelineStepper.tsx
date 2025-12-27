import { useDemoStore } from "../store/useDemoStore";

const steps = [
  "RTSP Frames",
  "Detect (YOLO OBB)",
  "Crop + Pair",
  "V2H (if vertical)",
  "OCR",
  "ISO Validate/Correct",
  "Send",
  "Correlate",
  "Archive"
];

export default function PipelineStepper() {
  const p = useDemoStore((s) => s.pipeline);

  const activeIdx = (() => {
    switch (p.state) {
      case "Idle": return 0;
      case "Candidate": return 2;
      case "OCR_Processing": return 4;
      case "Corrected": return 5;
      case "Validated": return 5;
      case "Sent": return 6;
      case "Correlated": return 7;
      case "Archived": return 8;
      case "Rejected": return 5;
      case "Dropped": return 1;
      case "Error": return 6;
      default: return 0;
    }
  })();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-400">Pipeline Stepper</div>
          <div className="text-lg font-semibold">Execution Trace</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
          State: <span className="font-semibold">{p.state}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        {steps.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div
              key={s}
              className={[
                "rounded-xl border px-3 py-2 text-sm",
                done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" :
                active ? "border-slate-200/30 bg-slate-100/10 text-slate-100" :
                "border-slate-800 bg-slate-950 text-slate-400"
              ].join(" ")}
            >
              <div className="font-semibold">{i + 1}. {s}</div>
              <div className="text-xs opacity-80">
                {done ? "Complete" : active ? "In progress" : "Pending"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
