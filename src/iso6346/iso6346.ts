import { loadAllowlist } from "./prefixAllowlist";

const ISO_REGEX = /^[A-Z]{3}(U|J|Z|R)[0-9]{7}$/;

const letterValues: Record<string, number> = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
  J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
  S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38
};

function pow2(n: number): number {
  return 1 << n;
}

export function computeCheckDigit(code10: string): number | null {
  // code10: 4 letters + 6 digits = 10 chars (without check digit)
  if (code10.length !== 10) return null;
  const chars = code10.split("");
  let sum = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    let v: number | undefined;
    if (/[A-Z]/.test(ch)) v = letterValues[ch];
    else if (/[0-9]/.test(ch)) v = Number(ch);
    else return null;
    sum += v * pow2(i);
  }
  const remainder = sum % 11;
  return remainder === 10 ? 0 : remainder;
}

export type IsoResult = {
  input: string;
  normalized: string;
  regexOk: boolean;
  computed?: number;
  observed?: number;
  checkOk: boolean;
  accepted?: string;
  corrected?: { value: string; reason: string };
  notes: string[];
};

const SUBS: Array<[RegExp, string]> = [
  [/O/g, "0"],
  [/I/g, "1"],
  [/S/g, "5"],
  [/B/g, "8"],
  [/Z/g, "2"]
];

const REVERSE_SUBS: Array<[RegExp, string]> = [
  [/0/g, "O"],
  [/1/g, "I"]
];

function normalize(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function applySubs(s: string): string[] {
  const out = new Set<string>();
  out.add(s);
  // forward subs
  let cur = [s];
  for (const [re, rep] of SUBS) {
    const next: string[] = [];
    for (const c of cur) {
      next.push(c);
      if (re.test(c)) next.push(c.replace(re, rep));
    }
    cur = next;
  }
  // reverse subs (digit->letter) mainly for prefix confusion
  for (const [re, rep] of REVERSE_SUBS) {
    const more: string[] = [];
    for (const c of cur) {
      more.push(c);
      if (re.test(c)) more.push(c.replace(re, rep));
    }
    cur = more;
  }
  for (const c of cur) out.add(c);
  return [...out];
}

export async function validateAndCorrectIso6346(input: string): Promise<IsoResult> {
  const normalized = normalize(input);
  const notes: string[] = [];

  const observed = normalized.length === 11 && /[0-9]$/.test(normalized) ? Number(normalized[10]) : undefined;
  const code10 = normalized.length >= 10 ? normalized.slice(0, 10) : "";
  const computed = code10.length === 10 ? computeCheckDigit(code10) ?? undefined : undefined;

  const regexOk = ISO_REGEX.test(normalized);
  const checkOk = regexOk && computed !== undefined && observed !== undefined && computed === observed;

  if (checkOk) {
    return {
      input,
      normalized,
      regexOk: true,
      computed,
      observed,
      checkOk: true,
      accepted: normalized,
      notes: ["Regex OK", "Check digit OK"]
    };
  }

  notes.push("Initial validation failed; attempting correction");

  const allow = await loadAllowlist();
  const candidates = applySubs(normalized);

  // Strong heuristic: if 4th char should be U/J/Z/R, try forcing U when it's digit-like.
  const forced: string[] = [];
  for (const c of candidates) {
    if (c.length >= 4) {
      const ch4 = c[3];
      if (!["U", "J", "Z", "R"].includes(ch4)) {
        forced.push(c.slice(0, 3) + "U" + c.slice(4));
      }
    }
  }

  const all = [...new Set([...candidates, ...forced])];

  let best: { value: string; reason: string } | undefined;

  for (const cand of all) {
    if (!ISO_REGEX.test(cand)) continue;
    const prefix = cand.slice(0, 4);
    if (allow.size > 0 && !allow.has(prefix)) continue;

    const c10 = cand.slice(0, 10);
    const obs = Number(cand[10]);
    const comp = computeCheckDigit(c10);
    if (comp !== null && comp === obs) {
      best = {
        value: cand,
        reason: allow.size > 0 ? "ISO valid after substitution + allowlist" : "ISO valid after substitution"
      };
      break;
    }
  }

  if (best) {
    return {
      input,
      normalized,
      regexOk,
      computed,
      observed,
      checkOk: false,
      corrected: best,
      accepted: best.value,
      notes: [...notes, "Correction succeeded"]
    };
  }

  return {
    input,
    normalized,
    regexOk,
    computed,
    observed,
    checkOk: false,
    notes: [...notes, "Correction failed"]
  };
}
