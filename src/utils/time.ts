export function toUtcIso(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
