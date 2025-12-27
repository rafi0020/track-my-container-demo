import { useMemo, useState } from "react";
import { useDemoStore } from "../store/useDemoStore";

const components = ["RTSP", "DETECTOR", "CROPPER", "V2H", "OCR", "ISO", "TELEMETRY", "CORRELATOR", "SYSTEM"] as const;
const levels = ["DEBUG", "INFO", "WARN", "ERROR"] as const;

// Group logs by container ID to show last N containers
function groupLogsByContainerId(logs: Array<{ t: number; component: string; level: string; msg: string; data?: unknown }>) {
  const groups: Array<{ containerId: string; logs: typeof logs }> = [];
  let currentId = "";
  let currentGroup: typeof logs = [];

  for (const log of logs) {
    // Check if this log contains a container ID
    const data = log.data as Record<string, unknown> | undefined;
    const containerId = data?.containerId as string | undefined;
    
    if (containerId && containerId !== currentId) {
      if (currentGroup.length > 0) {
        groups.push({ containerId: currentId, logs: currentGroup });
      }
      currentId = containerId;
      currentGroup = [log];
    } else {
      currentGroup.push(log);
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push({ containerId: currentId, logs: currentGroup });
  }
  
  return groups;
}

export default function LogsConsole() {
  const logs = useDemoStore((s) => s.logs);
  const [comp, setComp] = useState<string>("ALL");
  const [lvl, setLvl] = useState<string>("ALL");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    return logs.filter((l) => (comp === "ALL" ? true : l.component === comp) && (lvl === "ALL" ? true : l.level === lvl));
  }, [logs, comp, lvl]);

  // Get logs to display based on expanded state
  const displayLogs = useMemo(() => {
    if (expanded) {
      return filtered.slice(-250);
    }
    // Show only last 3 container ID groups
    const groups = groupLogsByContainerId(filtered);
    const lastThreeGroups = groups.slice(-3);
    return lastThreeGroups.flatMap(g => g.logs).slice(-30); // Limit to ~30 logs for minimal view
  }, [filtered, expanded]);

  const hasMoreLogs = filtered.length > displayLogs.length;

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

      <div className={`mt-4 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs ${expanded ? "h-[320px]" : "max-h-[180px]"}`}>
        {displayLogs.length === 0 ? (
          <div className="text-slate-500">No logs yet.</div>
        ) : (
          displayLogs.map((l, idx) => (
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

      {/* See More / See Less button */}
      {(hasMoreLogs || expanded) && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            {expanded ? "Show Less" : `See More (${filtered.length - displayLogs.length} more logs)`}
          </button>
        </div>
      )}
    </div>
  );
}
