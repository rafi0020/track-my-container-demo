import { EngineConfig } from "../engine";
import { EventBus } from "../eventBus";
import { LogEntry, Telemetry } from "../types";
import { SimEventMap } from "../simEventMap";
import { RNG } from "../../utils/rng";
import { toUtcIso } from "../../utils/time";

type Ctx = {
  bus: EventBus<SimEventMap>;
  rng: RNG;
  cfg: EngineConfig;
};

export function createTelemetry() {
  let ctx: Ctx | null = null;
  let lastEmit = 0;
  let seq = 0;

  // “Yard path” simulation
  let phase = 0;

  function emitLog(t: number, level: LogEntry["level"], msg: string, data?: LogEntry["data"]) {
    ctx?.bus.emit("log", { t, component: "TELEMETRY", level, msg, data });
  }

  function tick(t: number) {
    if (!ctx) return;

    const dt = t - lastEmit;
    if (dt < 500) return; // 2 Hz
    lastEmit = t;

    phase += 0.015 * (ctx.cfg.toggles.gateSideIssues ? 0.6 : 1);

    const baseLat = 23.8103;
    const baseLon = 90.4125;

    // small movement around base point
    const lat = baseLat + Math.sin(phase) * 0.0007;
    const lon = baseLon + Math.cos(phase) * 0.0007;

    const heightM = 10 + 2.5 * Math.abs(Math.sin(phase * 1.1));
    const altM = 7 + 0.8 * Math.sin(phase * 0.9);

    const pickDrop: Telemetry["pickDrop"] =
      phase % 6 < 1.5 ? "PICKED" : phase % 6 < 4.2 ? "IN_TRANSIT" : "DROPPED";

    const satellites = ctx.cfg.toggles.gateSideIssues ? 6 + ctx.rng.int(0, 3) : 9 + ctx.rng.int(0, 4);
    const rssiDbm = ctx.cfg.toggles.gateSideIssues ? -75 + ctx.rng.int(-6, 2) : -60 + ctx.rng.int(-4, 3);

    const epochMs = Date.now() + (t % 10_000);
    const tel: Telemetry = {
      deviceId: ctx.cfg.deviceId,
      tsUtcIso: toUtcIso(epochMs),
      epochMs,
      lat,
      lon,
      altM,
      heightM,
      pickDrop,
      satellites,
      rssiDbm,
      seq: ++seq
    };

    emitLog(t, "DEBUG", "Telemetry emitted", { pickDrop, lat: lat.toFixed(6), lon: lon.toFixed(6), seq });
    ctx.bus.emit("telemetry", tel);
  }

  return {
    init(c: Ctx) {
      ctx = c;
      lastEmit = 0;
      seq = 0;
      phase = 0;
      ctx.bus.emit("log", { t: 0, component: "TELEMETRY", level: "INFO", msg: "Telemetry generator initialized (ESP32 simulation)" });
    },
    tick
  };
}
