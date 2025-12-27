import { EngineConfig } from "../engine";
import { EventBus } from "../eventBus";
import { Artifact, ArtifactsState, Detection, FrameEvent, LogEntry } from "../types";
import { SimEventMap } from "../simEventMap";
import { RNG } from "../../utils/rng";
import { cropCanvas, makeCanvas } from "../../utils/canvas";

type Ctx = {
  bus: EventBus<SimEventMap>;
  rng: RNG;
  cfg: EngineConfig;
};

function obbToAabb(obb: { cx: number; cy: number; w: number; h: number }) {
  const x = obb.cx - obb.w / 2;
  const y = obb.cy - obb.h / 2;
  return { x, y, w: obb.w, h: obb.h };
}

export function createCropper() {
  let ctx: Ctx | null = null;

  function emitLog(t: number, level: LogEntry["level"], msg: string, data?: LogEntry["data"]) {
    ctx?.bus.emit("log", { t, component: "CROPPER", level, msg, data });
  }

  function decodeDataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = makeCanvas(img.width, img.height);
        const g = c.getContext("2d")!;
        g.drawImage(img, 0, 0);
        resolve(c);
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = dataUrl;
    });
  }

  async function onFrameDetections(frame: FrameEvent, dets: Detection[]) {
    if (!ctx) return;

    if (dets.length === 0) return;

    const canvas = await decodeDataUrlToCanvas(frame.imageDataUrl);

    const artifacts: ArtifactsState = {};

    const owner = dets.find((d) => d.cls === "horizontal_owner_code");
    const num = dets.find((d) => d.cls === "horizontal_identification_number");
    const vert = dets.find((d) => d.cls === "vertical_identification_number");

    if (owner) {
      const r = obbToAabb(owner.obb);
      const cc = cropCanvas(canvas, r.x, r.y, r.w, r.h);
      artifacts.ownerCrop = { label: "Owner Crop", dataUrl: cc.toDataURL("image/png"), meta: { conf: owner.conf } };
    }
    if (num) {
      const r = obbToAabb(num.obb);
      const cc = cropCanvas(canvas, r.x, r.y, r.w, r.h);
      artifacts.numberCrop = { label: "Number Crop", dataUrl: cc.toDataURL("image/png"), meta: { conf: num.conf } };
    }

    // Pairing
    if (owner && num) {
      const ro = obbToAabb(owner.obb);
      const rn = obbToAabb(num.obb);
      const x = Math.min(ro.x, rn.x);
      const y = Math.min(ro.y, rn.y);
      const w = Math.max(ro.x + ro.w, rn.x + rn.w) - x;
      const h = Math.max(ro.y + ro.h, rn.y + rn.h) - y;
      const cc = cropCanvas(canvas, x, y, w, h);
      artifacts.pairedCrop = { label: "Paired Crop (Owner+Digits)", dataUrl: cc.toDataURL("image/png"), meta: { pairing: "y-align+center-dist (sim)" } };
    }

    if (vert) {
      const r = obbToAabb(vert.obb);
      const cc = cropCanvas(canvas, r.x, r.y, r.w, r.h);
      artifacts.verticalCrop = { label: "Vertical Crop", dataUrl: cc.toDataURL("image/png"), meta: { conf: vert.conf } };
    }

    emitLog(frame.t, "INFO", "Crops generated", {
      owner: Boolean(artifacts.ownerCrop),
      number: Boolean(artifacts.numberCrop),
      paired: Boolean(artifacts.pairedCrop),
      vertical: Boolean(artifacts.verticalCrop)
    });

    ctx.bus.emit("log", { t: frame.t, component: "CROPPER", level: "DEBUG", msg: "Artifacts ready", data: { keys: Object.keys(artifacts) } });
    // Publish artifacts via a dedicated typed event
    ctx.bus.emit("artifacts", { t: frame.t, artifacts, frame });
  }

  // Store unsubscribe functions
  let unsubs: (() => void)[] = [];

  return {
    init(c: Ctx) {
      // Clean up previous subscriptions
      unsubs.forEach(fn => fn());
      unsubs = [];
      
      ctx = c;

      let lastFrame: FrameEvent | null = null;
      unsubs.push(ctx.bus.on("frame", (f) => {
        lastFrame = f;
      }));

      unsubs.push(ctx.bus.on("detections", (dets) => {
        if (!lastFrame) return;
        onFrameDetections(lastFrame, dets);
      }));

      ctx.bus.emit("log", { t: 0, component: "CROPPER", level: "INFO", msg: "Cropper initialized (simulated crop extraction + pairing)" });
    }
  };
}
