import { EngineConfig } from "../engine";
import { EventBus } from "../eventBus";
import { Detection, FrameEvent, LogEntry, OBB } from "../types";
import { SimEventMap } from "../simEventMap";
import { RNG } from "../../utils/rng";
import { clamp } from "../../utils/time";

type Ctx = {
  bus: EventBus<SimEventMap>;
  rng: RNG;
  cfg: EngineConfig;
};

export function createDetector() {
  let ctx: Ctx | null = null;

  function emitLog(level: LogEntry["level"], msg: string, data?: LogEntry["data"]) {
    ctx?.bus.emit("log", { t: (data?.t as number) ?? 0, component: "DETECTOR", level, msg, data });
  }

  function rectToObb(x: number, y: number, w: number, h: number, angleDeg: number): OBB {
    return { cx: x + w / 2, cy: y + h / 2, w, h, angleDeg };
  }

  function addNoiseToObb(obb: OBB, rng: RNG, hostility: number): OBB {
    const posJ = rng.normal(0, 2 + 8 * hostility);
    const posJ2 = rng.normal(0, 2 + 8 * hostility);
    const angJ = rng.normal(0, 1 + 6 * hostility);
    const wJ = rng.normal(0, 2 + 10 * hostility);
    const hJ = rng.normal(0, 2 + 10 * hostility);
    return {
      cx: obb.cx + posJ,
      cy: obb.cy + posJ2,
      w: clamp(obb.w + wJ, 20, 600),
      h: clamp(obb.h + hJ, 20, 400),
      angleDeg: obb.angleDeg + angJ
    };
  }

  function simulateDetections(frame: FrameEvent): Detection[] {
    if (!ctx) return [];
    const { rng, cfg } = ctx;
    const toggles = cfg.toggles;
    const hostile = toggles.rtspInstability || toggles.gateSideIssues ? 1 : 0;

    const gt = frame.groundTruth;
    const dets: Detection[] = [];
    const baseAngle = gt.textTiltDeg;

    // Confidence drops with glare/fade/hostility
    const qPenalty = 0.35 * gt.quality.glare + 0.35 * gt.quality.fade + 0.2 * gt.quality.blur + 0.2 * hostile;
    const baseConf = clamp(0.92 - qPenalty, 0.25, 0.98);

    const trackId = 7; // stable for demo

    if (gt.textOrientation === "horizontal") {
      const obbOwner = addNoiseToObb(rectToObb(gt.layout.ownerBox.x, gt.layout.ownerBox.y, gt.layout.ownerBox.w, gt.layout.ownerBox.h, baseAngle), rng, hostile);
      const obbNum = addNoiseToObb(rectToObb(gt.layout.numberBox.x, gt.layout.numberBox.y, gt.layout.numberBox.w, gt.layout.numberBox.h, baseAngle), rng, hostile);

      // occasional miss
      if (!rng.chance(0.06 + 0.12 * hostile)) {
        dets.push({ id: `d_${frame.frameId}_o`, cls: "horizontal_owner_code", obb: obbOwner, conf: baseConf, trackId });
      }
      if (!rng.chance(0.06 + 0.12 * hostile)) {
        dets.push({ id: `d_${frame.frameId}_n`, cls: "horizontal_identification_number", obb: obbNum, conf: baseConf, trackId });
      }
    } else {
      const obbV = addNoiseToObb(rectToObb(gt.layout.verticalBox.x, gt.layout.verticalBox.y, gt.layout.verticalBox.w, gt.layout.verticalBox.h, baseAngle), rng, hostile);
      if (!rng.chance(0.08 + 0.15 * hostile)) {
        dets.push({ id: `d_${frame.frameId}_v`, cls: "vertical_identification_number", obb: obbV, conf: baseConf, trackId });
      }
    }

    // emit logs
    ctx.bus.emit("log", {
      t: frame.t,
      component: "DETECTOR",
      level: "DEBUG",
      msg: "Detections produced (simulated YOLO OBB)",
      data: { count: dets.length, baseConf: baseConf.toFixed(2), hostility: hostile }
    });

    ctx.bus.emit("detections", dets);
    return dets;
  }

  // Store unsubscribe functions
  let unsubs: (() => void)[] = [];

  return {
    init(c: Ctx) {
      // Clean up previous subscriptions
      unsubs.forEach(fn => fn());
      unsubs = [];
      
      ctx = c;
      unsubs.push(ctx.bus.on("frame", (f: FrameEvent) => {
        simulateDetections(f);
      }));
      ctx.bus.emit("log", { t: 0, component: "DETECTOR", level: "INFO", msg: "Detector initialized (simulated YOLO OBB)" });
    }
  };
}
