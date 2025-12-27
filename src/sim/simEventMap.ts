/**
 * Canonical SimEventMap – all events emitted on the simulation EventBus.
 * This file provides strict typing and eliminates `(bus as any)` usage.
 */
import {
  Artifact,
  ArtifactsState,
  ContainerIdEvent,
  CorrelationResult,
  Detection,
  FrameEvent,
  IsoValidationResult,
  LogEntry,
  MetricsSnapshot,
  OcrResult,
  Telemetry,
  FusedEvent
} from "./types";

/**
 * Payload for the 'artifacts' event – cropped regions from detector output.
 */
export type ArtifactsEventPayload = {
  t: number;
  artifacts: ArtifactsState;
  frame: FrameEvent;
};

/**
 * Payload for the 'v2h' event – vertical-to-horizontal reconstructed strip.
 */
export type V2HEventPayload = {
  t: number;
  strip: Artifact;
  frame: FrameEvent;
};

/**
 * Payload for the 'ocr' event – OCR result + ISO validation.
 */
export type OcrEventPayload = {
  t: number;
  ocr: OcrResult;
  validation: IsoValidationResult;
  frame: FrameEvent;
};

/**
 * The canonical event map for the simulation bus.
 * All components should use EventBus<SimEventMap>.
 */
export type SimEventMap = {
  // Core pipeline events
  frame: FrameEvent;
  detections: Detection[];
  artifacts: ArtifactsEventPayload;
  v2h: V2HEventPayload;
  ocr: OcrEventPayload;

  // Telemetry
  telemetry: Telemetry;
  telemetryLatest: Telemetry;

  // Container ID and correlation
  containerId: ContainerIdEvent;
  correlation: CorrelationResult;
  fusedEvent: FusedEvent;

  // System events
  log: LogEntry;
  metrics: MetricsSnapshot;
};
