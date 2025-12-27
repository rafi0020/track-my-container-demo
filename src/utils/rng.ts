export type RNG = {
  next: () => number; // 0..1
  int: (min: number, max: number) => number; // inclusive
  pick: <T>(arr: T[]) => T;
  chance: (p: number) => boolean;
  normal: (mean: number, std: number) => number;
};

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed: number): RNG {
  const f = mulberry32(seed);
  return {
    next: () => f(),
    int: (min, max) => Math.floor(f() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    chance: (p) => f() < p,
    normal: (mean, std) => {
      // Box-Muller
      const u1 = Math.max(1e-9, f());
      const u2 = Math.max(1e-9, f());
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return mean + z0 * std;
    }
  };
}
