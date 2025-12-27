import { EngineConfig } from "../engine";
import { EventBus } from "../eventBus";
import { Artifact, FrameEvent, LogEntry } from "../types";
import { SimEventMap, ArtifactsEventPayload } from "../simEventMap";
import { RNG } from "../../utils/rng";
import { makeCanvas } from "../../utils/canvas";

type Ctx = {
  bus: EventBus<SimEventMap>;
  rng: RNG;
  cfg: EngineConfig;
};

export function createV2H() {
  let ctx: Ctx | null = null;

  function emitLog(t: number, level: LogEntry["level"], msg: string, data?: LogEntry["data"]) {
    ctx?.bus.emit("log", { t, component: "V2H", level, msg, data });
  }

  function reconstructStrip(containerNumber: string, quality: { glare: number; fade: number }): Artifact {
    // Simulate YOLO character detection and horizontal reassembly
    const chars = containerNumber.split("");
    const w = 520;
    const h = 90;
    const c = makeCanvas(w, h);
    const g = c.getContext("2d")!;
    g.fillStyle = "#0b1220";
    g.fillRect(0, 0, w, h);

    g.fillStyle = "rgba(255,255,255,0.08)";
    g.fillRect(14, 14, w - 28, h - 28);

    const alpha = Math.max(0.25, 1 - 0.6 * quality.fade - 0.4 * quality.glare);
    g.font = "bold 56px ui-sans-serif, system-ui";
    g.fillStyle = `rgba(248,250,252,${alpha})`;

    const step = (w - 60) / chars.length;
    for (let i = 0; i < chars.length; i++) {
      g.fillText(chars[i], 30 + i * step, 64);
    }

    // hint of glare
    if (quality.glare > 0) {
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0.0, "rgba(255,255,255,0)");
      grad.addColorStop(0.55, `rgba(255,255,255,${0.35 * quality.glare})`);
      grad.addColorStop(1.0, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }

    return {
      label: "V2H Reconstructed Strip",
      dataUrl: c.toDataURL("image/png"),
      meta: { method: "YOLO chars → sort(y) → concat(x) (sim)" }
    };
  }

  // Store unsubscribe functions
  let unsubs: (() => void)[] = [];

  return {
    init(c: Ctx) {
      // Clean up previous subscriptions
      unsubs.forEach(fn => fn());
      unsubs = [];
      
      ctx = c;

      unsubs.push(ctx.bus.on("artifacts", (payload: ArtifactsEventPayload) => {
        const { t, artifacts, frame } = payload;
        if (!artifacts.verticalCrop) return;

        const strip = reconstructStrip(frame.groundTruth.containerNumber, frame.groundTruth.quality);
        emitLog(t, "INFO", "Vertical→Horizontal reconstruction completed", { len: frame.groundTruth.containerNumber.length });
        ctx!.bus.emit("v2h", { t, strip, frame });
      }));

      ctx.bus.emit("log", { t: 0, component: "V2H", level: "INFO", msg: "V2H initialized (simulated ver_to_hor pipeline)" });
    }
  };
}
