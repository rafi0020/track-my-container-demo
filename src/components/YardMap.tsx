import { useMemo } from "react";
import { useDemoStore } from "../store/useDemoStore";

export default function YardMap() {
  const tel = useDemoStore((s) => s.pipeline.telemetryLatest);

  const pt = useMemo(() => {
    // Convert lat/lon around base to a small SVG coordinate
    if (!tel) return { x: 120, y: 80 };
    const baseLat = 23.8103;
    const baseLon = 90.4125;
    const dx = (tel.lon - baseLon) * 1_000_00; // scaled
    const dy = (tel.lat - baseLat) * 1_000_00;
    return { x: 140 + dx * 0.18, y: 120 - dy * 0.18 };
  }, [tel]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-sm text-slate-400">Yard Map (Offline)</div>
      <div className="text-lg font-semibold">Telemetry Location + Pick/Drop</div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
        <svg viewBox="0 0 320 220" className="h-[240px] w-full">
          <rect x="10" y="10" width="300" height="200" rx="14" fill="rgba(148,163,184,0.05)" stroke="rgba(148,163,184,0.18)" />
          {/* Lanes */}
          {Array.from({ length: 5 }).map((_, i) => (
            <rect key={i} x={26} y={26 + i * 34} width={268} height={24} rx={6} fill="rgba(15,23,42,0.8)" stroke="rgba(148,163,184,0.10)" />
          ))}
          {/* Capture zone */}
          <rect x="210" y="44" width="70" height="60" rx="10" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.35)" />
          <text x="214" y="60" fontSize="10" fill="rgba(52,211,153,0.9)">Capture Zone</text>

          {/* Device marker */}
          <circle cx={pt.x} cy={pt.y} r="7" fill="rgba(147,197,253,0.95)" />
          <circle cx={pt.x} cy={pt.y} r="14" fill="rgba(147,197,253,0.18)" />

          <text x="18" y="208" fontSize="10" fill="rgba(148,163,184,0.75)">
            {tel ? `Device=${tel.deviceId} | ${tel.pickDrop} | h=${tel.heightM.toFixed(1)}m | sat=${tel.satellites}` : "No telemetry yet"}
          </text>
        </svg>
      </div>
    </div>
  );
}
