import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDemoStore } from "../store/useDemoStore";
import { fmtMs, fmtPct } from "../utils/format";

export default function MetricsPanel() {
  const data = useDemoStore((s) => s.metrics);

  const last = data.length ? data[data.length - 1] : undefined;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Metrics</div>
          <div className="text-lg font-semibold">Latency, Success Rates, Retries</div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="text-slate-400">OCR Success</div>
          <div className="text-right font-semibold">{fmtPct(last?.ocrSuccessRate ?? 0)}</div>
          <div className="text-slate-400">ISO Valid</div>
          <div className="text-right font-semibold">{fmtPct(last?.isoValidRate ?? 0)}</div>
          <div className="text-slate-400">Correlation</div>
          <div className="text-right font-semibold">{fmtPct(last?.correlationSuccessRate ?? 0)}</div>
          <div className="text-slate-400">P50 E2E</div>
          <div className="text-right font-semibold">{fmtMs(last?.endToEndLatencyMsP50 ?? 0)}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-sm font-semibold">Success Rates</div>
          <div className="mt-2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-120)}>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={[0, 1]} />
                <Tooltip
                  contentStyle={{ background: "#020617", border: "1px solid #1f2937", borderRadius: 8 }}
                  formatter={(v: any, name: any) => [fmtPct(Number(v)), name]}
                  labelFormatter={() => ""}
                />
                <Line type="monotone" dataKey="ocrSuccessRate" dot={false} />
                <Line type="monotone" dataKey="isoValidRate" dot={false} />
                <Line type="monotone" dataKey="correlationSuccessRate" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Lines represent OCR success, ISO-valid acceptance, and telemetry correlation success.
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-sm font-semibold">End-to-End Latency (P50)</div>
          <div className="mt-2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.slice(-120)}>
                <XAxis dataKey="t" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#020617", border: "1px solid #1f2937", borderRadius: 8 }}
                  formatter={(v: any) => [fmtMs(Number(v)), "P50 Latency"]}
                  labelFormatter={() => ""}
                />
                <Line type="monotone" dataKey="endToEndLatencyMsP50" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            In hostile scenarios, drops/freezes and retries inflate latency; correlation remains guarded by validation and dedup.
          </div>
        </div>
      </div>
    </div>
  );
}
