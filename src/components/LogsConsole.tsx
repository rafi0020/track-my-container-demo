import { useMemo, useState } from "react";
import { useDemoStore } from "../store/useDemoStore";

const components = ["RTSP", "DETECTOR", "CROPPER", "V2H", "OCR", "ISO", "TELEMETRY", "CORRELATOR", "SYSTEM"] as const;
const levels = ["DEBUG", "INFO", "WARN", "ERROR"] as const;

export default function LogsConsole() {
  const logs = useDemoStore((s) => s.logs);
  const [comp, setComp] = useState<string>("ALL");
  const [lvl, setLvl] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return logs.filter((l) => (comp === "ALL" ? true : l.component === comp) && (lvl === "ALL" ? true : l.level === lvl));
  }, [logs, comp, lvl]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-400">Logs Console</div>
          <div className="text-lg font-semibold">Structured Logs</div>
        </div>
        <div className="flex gap-2">
          <select value={comp} onChange={(e) => setComp(e.target.value)} aria-label="Filter by component" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="ALL">All components</option>
            {components.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={lvl} onChange={(e) => setLvl(e.target.value)} aria-label="Filter by log level" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            <option value="ALL">All levels</option>
            {levels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 h-[320px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="text-slate-500">No logs yet.</div>
        ) : (
          filtered
            .slice(-250)
            .map((l, idx) => (
              <div key={idx} className="whitespace-pre-wrap break-words border-b border-slate-900 py-1">
                <span className="text-slate-500">{Math.round(l.t).toString().padStart(6, " ")}ms</span>{" "}
                <span className="text-slate-400">[{l.component}]</span>{" "}
                <span
                  className={
                    l.level === "ERROR"
                      ? "text-rose-300"
                      : l.level === "WARN"
                      ? "text-amber-300"
                      : l.level === "INFO"
                      ? "text-emerald-300"
                      : "text-slate-300"
                  }
                >
                  {l.level}
                </span>{" "}
                <span className="text-slate-100">{l.msg}</span>
                {l.data ? <span className="text-slate-400"> {" " + JSON.stringify(l.data)}</span> : null}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
