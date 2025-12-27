import { EngineConfig } from "../engine";
import { EventBus } from "../eventBus";
import { ContainerIdEvent, FrameEvent, IsoValidationResult, LogEntry, OcrResult } from "../types";
import { SimEventMap, ArtifactsEventPayload, V2HEventPayload } from "../simEventMap";
import { RNG } from "../../utils/rng";
import { validateAndCorrectIso6346 } from "../../iso6346/iso6346";
import { clamp, toUtcIso } from "../../utils/time";

type Ctx = {
  bus: EventBus<SimEventMap>;
  rng: RNG;
  cfg: EngineConfig;
};

function introduceOcrNoise(gt: string, rng: RNG, severity: number): { text: string; conf: number; notes: string[] } {
  // Severity 0..1 affects substitution probability.
  const notes: string[] = [];
  let s = gt;

  const subMap: Array<[RegExp, string, string]> = [
    [/0/g, "O", "0→O"],
    [/1/g, "I", "1→I"],
    [/5/g, "S", "5→S"],
    [/8/g, "B", "8→B"]
  ];

  const p = clamp(0.06 + 0.34 * severity, 0, 0.55);

  for (const [re, rep, label] of subMap) {
    if (rng.chance(p * 0.5)) {
      if (re.test(s)) {
        s = s.replace(re, rep);
        notes.push(label);
      }
    }
  }

  // occasional dropped character
  if (rng.chance(p * 0.12) && s.length >= 11) {
    const idx = rng.int(0, s.length - 1);
    s = s.slice(0, idx) + s.slice(idx + 1);
    notes.push("drop_char");
  }

  const conf = clamp(0.94 - 0.5 * severity - 0.08 * notes.length, 0.2, 0.98);
  return { text: s, conf, notes };
}

export function createOcr() {
  let ctx: Ctx | null = null;
  let lastContainerEventAt = -999999;

  function emitLog(t: number, level: LogEntry["level"], msg: string, data?: LogEntry["data"]) {
    ctx?.bus.emit("log", { t, component: "OCR", level, msg, data });
  }

  function severityFromFrame(frame: FrameEvent, toggles: EngineConfig["toggles"]): number {
    const q = frame.groundTruth.quality;
    let s = 0.45 * q.glare + 0.45 * q.fade + 0.25 * q.blur;
    if (toggles.gateSideIssues) s += 0.15;
    return clamp(s, 0, 1);
  }

  async function handleCandidate(t: number, frame: FrameEvent, source: "pairedCrop" | "v2hStrip") {
    if (!ctx) return;
    const { rng, cfg } = ctx;

    // Dedup-like behavior: avoid spamming if operator holds too long
    const holdSpam = cfg.toggles.operatorMistakes ? 2500 : 1400;
    if (t - lastContainerEventAt < holdSpam) {
      emitLog(t, "WARN", "Candidate suppressed (hold/dedup window)", { windowMs: holdSpam });
      return;
    }

    const sev = severityFromFrame(frame, cfg.toggles);
    const noisy = introduceOcrNoise(frame.groundTruth.containerNumber, rng, sev);

    const ocr: OcrResult = {
      rawText: noisy.text,
      confidence: noisy.conf,
      source
    };

    emitLog(t, "INFO", "OCR produced raw text (simulated PaddleOCR rec-only)", {
      source,
      rawText: ocr.rawText,
      conf: ocr.confidence.toFixed(2),
      noise: noisy.notes
    });

    ctx.bus.emit("log", { t, component: "ISO", level: "DEBUG", msg: "Running ISO 6346 validation", data: { input: ocr.rawText } });

    const iso = await validateAndCorrectIso6346(ocr.rawText);
    const validation: IsoValidationResult = {
      input: iso.input,
      isRegexOk: iso.regexOk,
      computedCheckDigit: iso.computed,
      observedCheckDigit: iso.observed,
      isCheckDigitOk: iso.checkOk,
      corrected: iso.corrected ? { value: iso.corrected.value, reason: iso.corrected.reason } : undefined,
      acceptedValue: iso.accepted,
      notes: iso.notes
    };

    ctx.bus.emit("log", {
      t,
      component: "ISO",
      level: validation.acceptedValue ? "INFO" : "WARN",
      msg: validation.acceptedValue ? "ISO accepted" : "ISO rejected",
      data: {
        accepted: validation.acceptedValue ?? null,
        regexOk: validation.isRegexOk,
        checkOk: validation.isCheckDigitOk,
        corrected: validation.corrected?.value ?? null
      }
    });

    ctx.bus.emit("ocr", { t, ocr, validation, frame });

    if (!validation.acceptedValue) {
      lastContainerEventAt = t;
      return;
    }

    // Simulate send to backend with retry under gate-side issues
    const event: ContainerIdEvent = {
      deviceId: cfg.deviceId,
      tsUtcIso: toUtcIso(Date.now() + (t % 10_000)), // stable-ish in demo
      epochMs: Date.now() + (t % 10_000),
      containerNumber: validation.acceptedValue,
      confidence: ocr.confidence,
      imageRef: source
    };

    const needsRetry = cfg.toggles.gateSideIssues && rng.chance(0.35);
    if (needsRetry) {
      emitLog(t, "WARN", "API send failed (simulated); retrying with backoff", { attempt: 1 });
      // second attempt success
      emitLog(t + 450, "INFO", "API send retry succeeded", { attempt: 2 });
    } else {
      emitLog(t, "INFO", "API send succeeded (simulated)");
    }

    lastContainerEventAt = t;
    ctx.bus.emit("containerId", event);
  }

  // Store unsubscribe functions
  let unsubs: (() => void)[] = [];

  return {
    init(c: Ctx) {
      // Clean up previous subscriptions
      unsubs.forEach(fn => fn());
      unsubs = [];
      
      // Reset internal state
      lastContainerEventAt = -999999;
      
      ctx = c;

      // From artifacts: prefer pairedCrop if available
      unsubs.push(ctx.bus.on("artifacts", (payload: ArtifactsEventPayload) => {
        const { t, artifacts, frame } = payload;
        if (artifacts.pairedCrop) {
          handleCandidate(t, frame, "pairedCrop");
        }
      }));

      // From v2h: handle vertical case
      unsubs.push(ctx.bus.on("v2h", (payload: V2HEventPayload) => {
        const { t, frame } = payload;
        handleCandidate(t, frame, "v2hStrip");
      }));

      ctx.bus.emit("log", { t: 0, component: "OCR", level: "INFO", msg: "OCR initialized (simulated PaddleOCR + ISO validation/correction)" });
    }
  };
}
