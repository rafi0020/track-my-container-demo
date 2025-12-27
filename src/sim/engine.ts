import { EventBus } from "./eventBus";
import { makeRng } from "../utils/rng";
import { getScenario } from "./scenarios";
import {
  DemoScenarioId,
  DemoToggles,
  LogEntry,
  MetricsSnapshot
} from "./types";
import { SimEventMap } from "./simEventMap";
import { createRtspSource } from "./components/rtspSource";
import { createDetector } from "./components/detector";
import { createCropper } from "./components/cropper";
import { createV2H } from "./components/v2h";
import { createOcr } from "./components/ocr";
import { createTelemetry } from "./components/telemetry";
import { createCorrelator } from "./components/correlator";

export type EngineConfig = {
  scenarioId: DemoScenarioId;
  toggles: DemoToggles;
  speed: 0.5 | 1 | 2 | 4;
  deviceId: string;
};

export class DemoEngine {
  private bus = new EventBus<SimEventMap>();
  private raf: number | null = null;
  private startReal = 0;
  private lastReal = 0;
  private nowSim = 0;

  private running = false;
  private stepMode = false;
  private requestedStep = false;

  private cfg: EngineConfig;
  private rng: ReturnType<typeof makeRng>;

  private rtsp = createRtspSource();
  private detector = createDetector();
  private cropper = createCropper();
  private v2h = createV2H();
  private ocr = createOcr();
  private telemetry = createTelemetry();
  private correlator = createCorrelator();

  constructor(cfg: EngineConfig) {
    this.cfg = cfg;
    const scenario = getScenario(cfg.scenarioId);
    this.rng = makeRng(scenario.seed);

    // Wire components
    this.rtsp.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.detector.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.cropper.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.v2h.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.ocr.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.telemetry.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.correlator.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });

    // Boot logs
    this.emitLog("SYSTEM", "INFO", `Engine initialized for scenario=${cfg.scenarioId}`);
  }

  on<K extends keyof SimEventMap>(event: K, handler: (payload: SimEventMap[K]) => void) {
    return this.bus.on(event, handler);
  }

  setRunning(v: boolean) {
    if (v === this.running) return; // No change needed
    this.running = v;
    if (v) this.loopStart();
    else this.loopStop();
  }

  setStepMode(v: boolean) {
    this.stepMode = v;
    this.emitLog("SYSTEM", "INFO", `Step mode ${v ? "enabled" : "disabled"}`);
  }

  requestStep() {
    this.requestedStep = true;
    if (!this.running) {
      // In step mode, we still need a single tick.
      this.loopStart(true);
    }
  }

  setSpeed(s: 0.5 | 1 | 2 | 4) {
    this.cfg.speed = s;
    this.emitLog("SYSTEM", "INFO", `Speed set to ${s}x`);
  }

  updateToggles(t: DemoToggles) {
    this.cfg.toggles = t;
    this.emitLog("SYSTEM", "INFO", "Toggles updated", { toggles: t });
  }

  /**
   * Reset the simulation to initial state without changing scenario.
   * Reinitializes all components, clears simulation time, and resets RNG.
   */
  reset() {
    // Immediately cancel any animation frame
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.running = false;
    this.stepMode = false;
    this.requestedStep = false;
    this.nowSim = 0;
    this.startReal = 0;
    this.lastReal = 0;

    // Reset RNG to get consistent behavior on restart
    const scenario = getScenario(this.cfg.scenarioId);
    this.rng = makeRng(scenario.seed);

    // Reset rolling metrics
    this.rolling = {
      frames: 0,
      drops: 0,
      freezes: 0,
      detections: 0,
      ocrOk: 0,
      ocrTotal: 0,
      isoOk: 0,
      isoTotal: 0,
      apiRetry: 0,
      apiTotal: 0,
      corrOk: 0,
      corrTotal: 0,
      latencies: []
    };

    // Recreate components to reset their internal state
    this.rtsp = createRtspSource();
    this.detector = createDetector();
    this.cropper = createCropper();
    this.v2h = createV2H();
    this.ocr = createOcr();
    this.telemetry = createTelemetry();
    this.correlator = createCorrelator();

    this.rtsp.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.detector.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.cropper.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.v2h.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.ocr.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.telemetry.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.correlator.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });

    this.emitLog("SYSTEM", "INFO", "Engine reset");
  }

  updateScenario(scenarioId: DemoScenarioId) {
    // Immediately cancel any animation frame
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.running = false;
    this.stepMode = false;
    this.requestedStep = false;
    
    this.cfg.scenarioId = scenarioId;
    const scenario = getScenario(scenarioId);
    this.rng = makeRng(scenario.seed);
    this.nowSim = 0;
    this.startReal = 0;
    this.lastReal = 0;

    // Reset rolling metrics
    this.rolling = {
      frames: 0,
      drops: 0,
      freezes: 0,
      detections: 0,
      ocrOk: 0,
      ocrTotal: 0,
      isoOk: 0,
      isoTotal: 0,
      apiRetry: 0,
      apiTotal: 0,
      corrOk: 0,
      corrTotal: 0,
      latencies: []
    };

    // Recreate components to reset their internal state
    this.rtsp = createRtspSource();
    this.detector = createDetector();
    this.cropper = createCropper();
    this.v2h = createV2H();
    this.ocr = createOcr();
    this.telemetry = createTelemetry();
    this.correlator = createCorrelator();

    this.rtsp.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.detector.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.cropper.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.v2h.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.ocr.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.telemetry.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });
    this.correlator.init({ bus: this.bus, rng: this.rng, cfg: this.cfg });

    this.emitLog("SYSTEM", "INFO", `Scenario switched to ${scenarioId} (seed=${scenario.seed})`);
  }

  destroy() {
    this.loopStop();
    this.bus.clear();
  }

  private loopStart(singleTick = false) {
    if (this.raf !== null) return;
    if (!this.running && !singleTick) return; // Don't start if not running
    
    this.startReal = performance.now();
    this.lastReal = this.startReal;

    const tick = (tReal: number) => {
      // Check if we've been stopped before doing anything
      if (!this.running && !singleTick) {
        this.raf = null;
        return;
      }
      
      const dtReal = tReal - this.lastReal;
      this.lastReal = tReal;

      const dtSim = dtReal * this.cfg.speed;
      const shouldTick =
        !this.stepMode || (this.stepMode && this.requestedStep) || singleTick;

      if (shouldTick) {
        this.nowSim += dtSim;
        this.rtsp.tick(this.nowSim);
        this.telemetry.tick(this.nowSim);

        if (this.stepMode) this.requestedStep = false;
      }

      this.emitMetrics(this.nowSim);

      if (singleTick) {
        this.raf = null;
        return;
      }

      // Check running state again before scheduling next frame
      if (this.running) {
        this.raf = requestAnimationFrame(tick);
      } else {
        this.raf = null;
      }
    };

    this.raf = requestAnimationFrame(tick);
  }

  private loopStop() {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  private emitLog(component: LogEntry["component"], level: LogEntry["level"], msg: string, data?: LogEntry["data"]) {
    this.bus.emit("log", { t: this.nowSim, component, level, msg, data });
  }

  private rolling = {
    frames: 0,
    drops: 0,
    freezes: 0,
    detections: 0,
    ocrOk: 0,
    ocrTotal: 0,
    isoOk: 0,
    isoTotal: 0,
    apiRetry: 0,
    apiTotal: 0,
    corrOk: 0,
    corrTotal: 0,
    latencies: [] as number[]
  };

  private emitMetrics(t: number) {
    // Metrics come from component logs via counters, but we keep it simple:
    // Components emit "metrics" events when useful; we also publish a periodic snapshot.
    // Emit snapshot each ~1000ms sim.
    if (Math.floor(t / 1000) === Math.floor((t - 16) / 1000)) return;

    const fps = this.rolling.frames; // approx frames per second in last bucket (sim time)
    const detPerMin = this.rolling.detections * 60;
    const ocrRate = this.rolling.ocrTotal > 0 ? this.rolling.ocrOk / this.rolling.ocrTotal : 0;
    const isoRate = this.rolling.isoTotal > 0 ? this.rolling.isoOk / this.rolling.isoTotal : 0;
    const retryRate = this.rolling.apiTotal > 0 ? this.rolling.apiRetry / this.rolling.apiTotal : 0;
    const corrRate = this.rolling.corrTotal > 0 ? this.rolling.corrOk / this.rolling.corrTotal : 0;

    const lat = this.rolling.latencies.slice().sort((a, b) => a - b);
    const p50 = lat.length ? lat[Math.floor(lat.length * 0.5)] : 0;

    const snap: MetricsSnapshot = {
      t,
      fps,
      rtspDrops: this.rolling.drops,
      rtspFreezes: this.rolling.freezes,
      detectionsPerMin: detPerMin,
      ocrSuccessRate: ocrRate,
      isoValidRate: isoRate,
      apiRetryRate: retryRate,
      correlationSuccessRate: corrRate,
      endToEndLatencyMsP50: p50
    };

    this.bus.emit("metrics", snap);

    // Reset bucket each second
    this.rolling.frames = 0;
    this.rolling.drops = 0;
    this.rolling.freezes = 0;
    this.rolling.detections = 0;
    this.rolling.ocrOk = 0;
    this.rolling.ocrTotal = 0;
    this.rolling.isoOk = 0;
    this.rolling.isoTotal = 0;
    this.rolling.apiRetry = 0;
    this.rolling.apiTotal = 0;
    this.rolling.corrOk = 0;
    this.rolling.corrTotal = 0;
    this.rolling.latencies = [];
  }

  // Exposed counters for components (wired through bus in a minimal way)
  counters() {
    return this.rolling;
  }
}
