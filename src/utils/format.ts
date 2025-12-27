export function fmtMs(ms: number): string {
  if (!Number.isFinite(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function fmtPct(x: number): string {
  if (!Number.isFinite(x)) return "-";
  return `${Math.round(x * 100)}%`;
}
