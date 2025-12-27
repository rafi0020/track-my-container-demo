import { EngineConfig } from "../engine";
import { EventBus } from "../eventBus";
import { ContainerIdEvent, CorrelationResult, FusedEvent, LogEntry, Telemetry } from "../types";
import { SimEventMap, ArtifactsEventPayload, OcrEventPayload } from "../simEventMap";
import { RNG } from "../../utils/rng";

type Ctx = {
  bus: EventBus<SimEventMap>;
  rng: RNG;
  cfg: EngineConfig;
};

function ulidLike(rng: RNG): string {
  const a = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let out = "";
  for (let i = 0; i < 26; i++) out += a[Math.floor(rng.next() * a.length)];
  return out;
}

export function createCorrelator() {
  let ctx: Ctx | null = null;
  let telemetryBuffer: Telemetry[] = [];
  let lastArtifacts: any = {};
  let lastValidation: any = null;

  function emitLog(t: number, level: LogEntry["level"], msg: string, data?: LogEntry["data"]) {
    ctx?.bus.emit("log", { t, component: "CORRELATOR", level, msg, data });
  }

  function dedupKey(deviceId: string, container: string, epochMs: number): string {
    const bucketMin = Math.floor(epochMs / 60000);
    return `${deviceId}:${container}:${bucketMin}`;
  }

  function findNearestTelemetry(epochMs: number, deviceId: string): { tel?: Telemetry; deltaMs?: number } {
    const windowMs = 3000;
    let best: Telemetry | undefined;
    let bestDelta = Infinity;

    for (const t of telemetryBuffer) {
      if (t.deviceId !== deviceId) continue;
      const d = Math.abs(t.epochMs - epochMs);
      if (d <= windowMs && d < bestDelta) {
        best = t;
        bestDelta = d;
      }
    }
    return { tel: best, deltaMs: best ? bestDelta : undefined };
  }

  function trimTelemetry(nowEpochMs: number) {
    // Keep last 30 seconds
    telemetryBuffer = telemetryBuffer.filter((t) => nowEpochMs - t.epochMs <= 30_000);
  }

  // Store unsubscribe functions
  let unsubs: (() => void)[] = [];

  return {
    init(c: Ctx) {
      // Clean up previous subscriptions
      unsubs.forEach(fn => fn());
      unsubs = [];
      
      // Reset internal state
      telemetryBuffer = [];
      lastArtifacts = {};
      lastValidation = null;
      
      ctx = c;

      unsubs.push(ctx.bus.on("telemetry", (tel) => {
        telemetryBuffer.push(tel);
        trimTelemetry(tel.epochMs);
        ctx!.bus.emit("telemetryLatest", tel);
      }));

      unsubs.push(ctx.bus.on("artifacts", (payload: ArtifactsEventPayload) => {
        lastArtifacts = payload.artifacts ?? {};
      }));

      unsubs.push(ctx.bus.on("ocr", (payload: OcrEventPayload) => {
        lastValidation = payload.validation ?? null;
      }));

      unsubs.push(ctx.bus.on("containerId", (cid) => {
        if (!ctx) return;
        const mode = ctx.cfg.toggles.correlationModeBackend ? "backend_correlation" : "edge_bundling";

        let corr: CorrelationResult;

        if (mode === "backend_correlation") {
          const { tel, deltaMs } = findNearestTelemetry(cid.epochMs, cid.deviceId);
          corr = {
            mode,
            matchedTelemetry: tel,
            deltaMs,
            success: Boolean(tel),
            notes: tel ? ["Matched nearest telemetry within ±3s"] : ["No telemetry within correlation window"]
          };
        } else {
          // edge bundling: attach latest telemetry at recognition time
          const latest = telemetryBuffer.length ? telemetryBuffer[telemetryBuffer.length - 1] : undefined;
          corr = {
            mode,
            matchedTelemetry: latest,
            deltaMs: latest ? Math.abs(latest.epochMs - cid.epochMs) : undefined,
            success: Boolean(latest),
            notes: latest ? ["Bundled latest telemetry snapshot at recognition time"] : ["No telemetry available to bundle"]
          };
        }

        const integrity =
          lastValidation?.acceptedValue === cid.containerNumber
            ? lastValidation?.corrected
              ? { isoStatus: "corrected" as const, correctionApplied: lastValidation.corrected.reason }
              : { isoStatus: "valid" as const }
            : { isoStatus: "valid" as const };

        const fused: FusedEvent = {
          eventId: ulidLike(ctx.rng),
          dedupKey: dedupKey(cid.deviceId, cid.containerNumber, cid.epochMs),
          deviceId: cid.deviceId,
          tsUtcIso: cid.tsUtcIso,
          epochMs: cid.epochMs,
          containerNumber: cid.containerNumber,
          containerConfidence: cid.confidence,
          telemetry: corr.matchedTelemetry,
          correlation: corr,
          artifacts: lastArtifacts,
          integrity
        };

        emitLog(0, corr.success ? "INFO" : "WARN", "Correlation processed", {
          mode,
          success: corr.success,
          deltaMs: corr.deltaMs
        });

        ctx.bus.emit("correlation", corr);
        ctx.bus.emit("fusedEvent", fused);
      }));

      ctx.bus.emit("log", { t: 0, component: "CORRELATOR", level: "INFO", msg: "Correlator initialized (backend correlation vs edge bundling)" });
    }
  };
}
