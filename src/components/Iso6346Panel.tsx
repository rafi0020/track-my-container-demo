import { useDemoStore } from "../store/useDemoStore";
import { LogEntry } from "../sim/types";

/**
 * ISO 6346 Validation Panel
 * Shows the ISO 6346 container number validation process with detailed logs.
 */
export default function Iso6346Panel() {
  const validation = useDemoStore((s) => s.pipeline.validation);
  const ocr = useDemoStore((s) => s.pipeline.ocr);
  const logs = useDemoStore((s) => s.logs);

  // Filter logs to only ISO-related entries
  const isoLogs = logs.filter((l) => l.component === "ISO" || l.component === "OCR");
  const recentIsoLogs = isoLogs.slice(-10); // Show last 10 ISO logs

  // Status styling
  const getStatusStyle = () => {
    if (!validation) return { bg: "bg-slate-800", border: "border-slate-700", text: "text-slate-400" };
    if (validation.acceptedValue) {
      if (validation.corrected) {
        return { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400" };
      }
      return { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400" };
    }
    return { bg: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-400" };
  };

  const status = getStatusStyle();

  // Check digit visualization
  const renderCheckDigitRow = () => {
    if (!validation) return null;
    
    const input = validation.input || "";
    const code10 = input.slice(0, 10);
    const observedCD = input.length === 11 ? input[10] : "?";
    const computedCD = validation.computedCheckDigit;
    const isMatch = validation.isCheckDigitOk;

    return (
      <div className="space-y-2">
        <div className="text-xs text-slate-500 uppercase font-medium">Check Digit Calculation</div>
        <div className="flex items-center gap-1 font-mono text-lg">
          {/* Owner code (4 letters) */}
          {code10.slice(0, 4).split("").map((ch, i) => (
            <span key={`owner-${i}`} className="w-8 h-10 flex items-center justify-center rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {ch}
            </span>
          ))}
          <span className="text-slate-600 mx-1">-</span>
          {/* Serial number (6 digits) */}
          {code10.slice(4, 10).split("").map((ch, i) => (
            <span key={`serial-${i}`} className="w-8 h-10 flex items-center justify-center rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {ch}
            </span>
          ))}
          <span className="text-slate-600 mx-1">-</span>
          {/* Check digit */}
          <span className={`w-8 h-10 flex items-center justify-center rounded border-2 font-bold ${
            isMatch 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" 
              : "bg-rose-500/20 text-rose-400 border-rose-500"
          }`}>
            {observedCD}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Observed:</span>
          <span className="font-mono text-white">{observedCD}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Computed:</span>
          <span className="font-mono text-white">{computedCD ?? "N/A"}</span>
          <span className="text-slate-600">|</span>
          {isMatch ? (
            <span className="text-emerald-400">✓ Match</span>
          ) : (
            <span className="text-rose-400">✗ Mismatch</span>
          )}
        </div>
      </div>
    );
  };

  // Log entry component
  const renderLogEntry = (log: LogEntry, index: number) => {
    const levelColors: Record<string, string> = {
      DEBUG: "text-slate-500",
      INFO: "text-blue-400",
      WARN: "text-amber-400",
      ERROR: "text-rose-400"
    };

    return (
      <div key={index} className="flex items-start gap-2 text-xs font-mono py-1 border-b border-slate-800 last:border-0">
        <span className="text-slate-600 w-12 shrink-0">{(log.t / 1000).toFixed(1)}s</span>
        <span className={`w-12 shrink-0 ${levelColors[log.level]}`}>{log.level}</span>
        <span className="text-purple-400 w-12 shrink-0">{log.component}</span>
        <span className="text-slate-300 flex-1">{log.msg}</span>
      </div>
    );
  };

  return (
    <div className={`rounded-2xl border ${status.border} ${status.bg} p-4`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-slate-400">ISO 6346</div>
          <div className="text-lg font-semibold">Container Number Validation</div>
        </div>
        {validation && (
          <div className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${status.border} ${status.text}`}>
            {validation.acceptedValue 
              ? (validation.corrected ? "⚠ Corrected" : "✓ Valid")
              : "✗ Rejected"
            }
          </div>
        )}
      </div>

      {/* OCR Input */}
      {ocr && (
        <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase font-medium">OCR Input</span>
            <span className="text-xs text-slate-500">
              Confidence: <span className="text-white font-medium">{(ocr.confidence * 100).toFixed(0)}%</span>
            </span>
          </div>
          <div className="font-mono text-xl text-white tracking-wider">{ocr.rawText}</div>
          <div className="text-xs text-slate-500 mt-1">Source: {ocr.source}</div>
        </div>
      )}

      {/* Check Digit Visualization */}
      {validation && (
        <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          {renderCheckDigitRow()}
        </div>
      )}

      {/* Validation Details */}
      {validation && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="text-xs text-slate-500 uppercase font-medium mb-1">Regex Match</div>
            <div className="flex items-center gap-2">
              {validation.isRegexOk ? (
                <span className="text-emerald-400">✓ Valid Format</span>
              ) : (
                <span className="text-rose-400">✗ Invalid Format</span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-1">Pattern: AAA[UJZR]######C</div>
          </div>
          
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="text-xs text-slate-500 uppercase font-medium mb-1">Final Result</div>
            {validation.acceptedValue ? (
              <div className="font-mono text-lg text-emerald-400">{validation.acceptedValue}</div>
            ) : (
              <div className="text-rose-400">No valid container number</div>
            )}
          </div>
        </div>
      )}

      {/* Correction Applied */}
      {validation?.corrected && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="text-xs text-amber-400 uppercase font-medium mb-1">Correction Applied</div>
          <div className="text-sm text-amber-200">{validation.corrected.reason}</div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-slate-500">Original:</span>
            <span className="font-mono text-slate-400 line-through">{validation.input}</span>
            <span className="text-slate-500">→</span>
            <span className="font-mono text-amber-400">{validation.corrected.value}</span>
          </div>
        </div>
      )}

      {/* Validation Notes */}
      {validation?.notes && validation.notes.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="text-xs text-slate-500 uppercase font-medium mb-2">Validation Notes</div>
          <ul className="space-y-1">
            {validation.notes.map((note, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ISO Logs */}
      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 uppercase font-medium">ISO/OCR Logs</span>
          <span className="text-xs text-slate-600">{recentIsoLogs.length} entries</span>
        </div>
        <div className="max-h-40 overflow-y-auto">
          {recentIsoLogs.length > 0 ? (
            recentIsoLogs.map((log, i) => renderLogEntry(log, i))
          ) : (
            <div className="text-sm text-slate-600 text-center py-4">
              No ISO validation logs yet. Start the simulation.
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!validation && !ocr && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-sm">Waiting for container number detection...</div>
          <div className="text-xs text-slate-600 mt-1">Start the simulation to see ISO 6346 validation</div>
        </div>
      )}
    </div>
  );
}
