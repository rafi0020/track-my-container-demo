let cached: Set<string> | null = null;

// Fallback allowlist in case fetch fails
const FALLBACK_PREFIXES = ["MSCU", "TGHU", "OOLU", "CMAU", "GESU", "MAEU", "HLCU", "SEGU", "TRHU"];

export async function loadAllowlist(): Promise<Set<string>> {
  if (cached) return cached;
  try {
    // Fetch from public folder (Vite serves public/ at root)
    const res = await fetch(`${import.meta.env.BASE_URL}prefix_allowlist.json`);
    if (!res.ok) throw new Error("allowlist fetch failed");
    const json = (await res.json()) as { prefixes: string[] };
    cached = new Set((json.prefixes ?? []).map((x) => String(x).toUpperCase()));
    return cached;
  } catch {
    // fallback allowlist
    cached = new Set(FALLBACK_PREFIXES);
    return cached;
  }
}
