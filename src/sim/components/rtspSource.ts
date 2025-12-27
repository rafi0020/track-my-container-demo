import { EngineConfig } from "../engine";
import { EventBus } from "../eventBus";
import { FrameEvent, LogEntry } from "../types";
import { SimEventMap } from "../simEventMap";
import { RNG } from "../../utils/rng";
import { applySimpleFisheyeApprox, canvasToDataUrl, drawNoise, makeCanvas } from "../../utils/canvas";
import { clamp } from "../../utils/time";
import { computeCheckDigit } from "../../iso6346/iso6346";

type Ctx = {
  bus: EventBus<SimEventMap>;
  rng: RNG;
  cfg: EngineConfig;
};

export function createRtspSource() {
  let ctx: Ctx | null = null;
  let frameId = 0;

  // RTSP instability simulation
  let freezeUntil = 0;
  let lastEmit = 0;

  // Capture window: stable container number for 3-6 seconds
  let currentContainerNumber: string | null = null;
  let captureWindowEndsAt = 0;

  // Simple frame queue (jitter buffering)
  const queue: FrameEvent[] = [];

  const W = 960;
  const H = 540;

  function emitLog(level: LogEntry["level"], msg: string, data?: LogEntry["data"]) {
    ctx?.bus.emit("log", { t: nowSim(), component: "RTSP", level, msg, data });
  }

  function nowSim() {
    return lastEmit;
  }

  function genContainerNumber(rng: RNG): string {
    // Choose from allowlist-like prefixes and compute check digit
    const prefixes = ["MSCU", "TGHU", "OOLU", "CMAU", "GESU", "MAEU", "HLCU", "SEGU", "TRHU"];
    const prefix = rng.pick(prefixes);
    const six = Array.from({ length: 6 }, () => rng.int(0, 9)).join("");
    const code10 = prefix + six;
    const cd = computeCheckDigit(code10) ?? rng.int(0, 9);
    return code10 + String(cd);
  }

  /**
   * Returns a stable container number for the current capture window.
   * Container persists for 1.5-3 seconds, then changes.
   */
  function getStableContainerNumber(rng: RNG, t: number): string {
    if (t >= captureWindowEndsAt || currentContainerNumber === null) {
      // Start new capture window
      currentContainerNumber = genContainerNumber(rng);
      const windowDuration = 1500 + rng.int(0, 1500); // 1.5-3 seconds
      captureWindowEndsAt = t + windowDuration;
      
      emitLog("DEBUG", "New capture window started", { 
        containerNumber: currentContainerNumber,
        windowMs: windowDuration 
      });
    }
    return currentContainerNumber;
  }

  function renderFrame(rng: RNG, toggles: EngineConfig["toggles"], scenarioId: EngineConfig["scenarioId"], t: number) {
    const c = makeCanvas(W, H);
    const g = c.getContext("2d")!;
    // Background
    g.fillStyle = "#0b1220";
    g.fillRect(0, 0, W, H);

    // Yard lines
    g.strokeStyle = "rgba(148,163,184,0.12)";
    g.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }

    // Container body
    const contX = 120;
    const contY = 140;
    const contW = 720;
    const contH = 240;

    g.fillStyle = "#1f2937";
    g.fillRect(contX, contY, contW, contH);

    // ribs
    g.strokeStyle = "rgba(226,232,240,0.10)";
    for (let i = 0; i <= 12; i++) {
      const xx = contX + (contW * i) / 12;
      g.beginPath();
      g.moveTo(xx, contY);
      g.lineTo(xx, contY + contH);
      g.stroke();
    }

    // Determine "ground truth"
    const vertical = toggles.verticalId;
    const glare = toggles.glareNight ? 0.75 : 0.0;
    const fade = toggles.fadedText ? 0.6 : 0.15;
    const operatorTilt = toggles.operatorMistakes ? rng.normal(10, 6) : rng.normal(0, 2);
    const tilt = clamp(operatorTilt, -18, 18);

    // Use stable container number within capture window
    const containerNumber = getStableContainerNumber(rng, t);
    const ownerCode = containerNumber.slice(0, 4);
    const serialDigits = containerNumber.slice(4);

    // Place text boxes
    const ownerBox = { x: contX + 110, y: contY + 90, w: 160, h: 60 };
    const numberBox = { x: contX + 290, y: contY + 90, w: 320, h: 60 };
    const verticalBox = { x: contX + 540, y: contY + 40, w: 90, h: 180 };

    // Text
    const baseOpacity = clamp(1 - fade, 0.2, 1.0);
    g.save();
    g.translate(contX + contW / 2, contY + contH / 2);
    g.rotate((tilt * Math.PI) / 180);
    g.translate(-(contX + contW / 2), -(contY + contH / 2));

    g.font = "bold 46px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    g.fillStyle = `rgba(248,250,252,${baseOpacity})`;

    if (!vertical) {
      g.fillText(ownerCode, ownerBox.x, ownerBox.y + 46);
      g.fillText(serialDigits, numberBox.x, numberBox.y + 46);
    } else {
      // draw vertically (characters stacked)
      g.font = "bold 40px ui-sans-serif, system-ui";
      g.fillStyle = `rgba(248,250,252,${baseOpacity})`;
      const s = containerNumber;
      const step = verticalBox.h / (s.length + 1);
      for (let i = 0; i < s.length; i++) {
        g.fillText(s[i], verticalBox.x, verticalBox.y + (i + 1) * step);
      }
    }

    g.restore();

    // glare overlay
    if (glare > 0) {
      g.save();
      const grad = g.createLinearGradient(0, contY, W, contY + contH);
      grad.addColorStop(0.2, `rgba(255,255,255,${0.0})`);
      grad.addColorStop(0.55, `rgba(255,255,255,${0.55 * glare})`);
      grad.addColorStop(0.85, `rgba(255,255,255,${0.0})`);
      g.fillStyle = grad;
      g.fillRect(contX, contY, contW, contH);
      g.restore();
    }

    // optional fisheye proxy
    if (toggles.fisheyeDistortion) {
      applySimpleFisheyeApprox(g, 0.9);
    }

    // noise proxy for "blur/age"
    drawNoise(g, toggles.fadedText ? 0.55 : 0.12, () => rng.next());

    const groundTruth = {
      containerNumber,
      ownerCode,
      serialDigits,
      textOrientation: vertical ? "vertical" : "horizontal",
      textTiltDeg: tilt,
      quality: {
        glare,
        fade,
        blur: toggles.operatorMistakes ? 0.35 : 0.1
      },
      layout: { ownerBox, numberBox, verticalBox }
    } as const;

    return { canvas: c, groundTruth };
  }

  function maybeEnqueueFrame(t: number) {
    if (!ctx) return;

    const { rng, cfg } = ctx;
    const toggles = cfg.toggles;

    // gate-side issues increase jitter + freezes and simulate more drops
    const isHostile = toggles.rtspInstability || toggles.gateSideIssues;

    // freeze simulation
    if (isHostile && freezeUntil < t && rng.chance(0.02)) {
      const dur = rng.int(600, 1800) * (toggles.gateSideIssues ? 1.4 : 1);
      freezeUntil = t + dur;
      emitLog("WARN", "RTSP freeze detected (simulated)", { freezeMs: dur });
    }

    // during freeze, no new frames
    if (t < freezeUntil) return;

    // drop simulation
    const dropP = isHostile ? 0.08 : 0.01;
    if (rng.chance(dropP)) {
      emitLog("WARN", "RTSP frame dropped (simulated)");
      return;
    }

    // produce frame ~15 fps sim
    const targetDt = 1000 / 15;
    if (t - lastEmit < targetDt) return;

    const { canvas, groundTruth } = renderFrame(rng, toggles, cfg.scenarioId, t);

    const fe: FrameEvent = {
      t,
      frameId: ++frameId,
      imageDataUrl: canvasToDataUrl(canvas),
      width: canvas.width,
      height: canvas.height,
      groundTruth
    };

    // jitter buffer: add variable delay
    const jitterMs = isHostile ? Math.max(0, rng.normal(120, 80)) : Math.max(0, rng.normal(20, 10));
    // Store delay as meta by pushing into queue with "virtual emit time"
    (fe as any)._emitAt = t + jitterMs;
    queue.push(fe);

    lastEmit = t;
  }

  function flushQueue(t: number) {
    if (!ctx) return;

    // emit any frames whose emitAt <= t
    queue.sort((a, b) => ((a as any)._emitAt ?? a.t) - ((b as any)._emitAt ?? b.t));
    while (queue.length && ((queue[0] as any)._emitAt ?? queue[0].t) <= t) {
      const fe = queue.shift()!;
      ctx.bus.emit("frame", fe);
      // Count frames in engine metrics: via log event, store counts in UI store.
      ctx.bus.emit("log", {
        t,
        component: "RTSP",
        level: "DEBUG",
        msg: "Frame emitted",
        data: { frameId: fe.frameId, orientation: fe.groundTruth.textOrientation }
      });
    }

    // prevent unbounded queue
    if (queue.length > 10) queue.splice(0, queue.length - 10);
  }

  return {
    init(c: Ctx) {
      ctx = c;
      frameId = 0;
      freezeUntil = 0;
      lastEmit = 0;
      currentContainerNumber = null;
      captureWindowEndsAt = 0;
      queue.length = 0;
      emitLog("INFO", "RTSP source initialized (synthetic canvas frames)");
    },
    tick(t: number) {
      maybeEnqueueFrame(t);
      flushQueue(t);
    }
  };
}
