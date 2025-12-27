export type DemoScenarioId =
  | "horizontal_id_capture"
  | "vertical_id_capture";

export type SimSpeed = 0.5 | 1 | 2 | 4;

export type DemoToggles = {
  rtspInstability: boolean;
  fisheyeDistortion: boolean;
  verticalId: boolean;
  glareNight: boolean;
  fadedText: boolean;
  operatorMistakes: boolean;
  gateSideIssues: boolean;
  correlationModeBackend: boolean; // true=backend correlation, false=edge bundling
};

export type PipelineLifecycleState =
  | "Idle"
  | "Candidate"
  | "OCR_Processing"
  | "Validated"
  | "Corrected"
  | "Sent"
  | "Correlated"
  | "Archived"
  | "Rejected"
  | "Dropped"
  | "Error";

export type OBB = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  angleDeg: number;
};

export type Detection = {
  id: string;
  cls: "horizontal_owner_code" | "horizontal_identification_number" | "vertical_identification_number";
  obb: OBB;
  conf: number;
  trackId: number;
};

export type FrameGroundTruth = {
  containerNumber: string; // true intended number
  ownerCode: string; // first 4 (e.g., MSCU)
  serialDigits: string; // 7 digits (incl check digit)
  textOrientation: "horizontal" | "vertical";
  textTiltDeg: number;
  quality: {
    glare: number; // 0..1
    fade: number; // 0..1
    blur: number; // 0..1
  };
  layout: {
    ownerBox: { x: number; y: number; w: number; h: number };
    numberBox: { x: number; y: number; w: number; h: number };
    verticalBox: { x: number; y: number; w: number; h: number };
  };
};

export type FrameEvent = {
  t: number; // sim time ms
  frameId: number;
  imageDataUrl: string; // for UI preview
  width: number;
  height: number;
  groundTruth: FrameGroundTruth;
};

export type Artifact = {
  label: string;
  dataUrl: string;
  meta?: Record<string, string | number | boolean>;
};

export type ArtifactsState = Partial<{
  ownerCrop: Artifact;
  numberCrop: Artifact;
  pairedCrop: Artifact;
  verticalCrop: Artifact;
  v2hStrip: Artifact;
}>;

export type OcrResult = {
  rawText: string;
  confidence: number; // 0..1
  source: "pairedCrop" | "v2hStrip";
};

export type IsoValidationResult = {
  input: string;
  isRegexOk: boolean;
  computedCheckDigit?: number;
  observedCheckDigit?: number;
  isCheckDigitOk: boolean;
  corrected?: {
    value: string;
    reason: string;
  };
  acceptedValue?: string;
  notes: string[];
};

export type Telemetry = {
  deviceId: string;
  tsUtcIso: string;
  epochMs: number;
  lat: number;
  lon: number;
  altM: number;
  heightM: number;
  pickDrop: "PICKED" | "IN_TRANSIT" | "DROPPED" | "UNKNOWN";
  satellites: number;
  rssiDbm: number;
  seq: number;
};

export type ContainerIdEvent = {
  deviceId: string;
  tsUtcIso: string;
  epochMs: number;
  containerNumber: string;
  confidence: number;
  imageRef?: string; // in demo: artifact id
};

export type CorrelationResult = {
  mode: "backend_correlation" | "edge_bundling";
  matchedTelemetry?: Telemetry;
  deltaMs?: number;
  success: boolean;
  notes: string[];
};

export type FusedEvent = {
  eventId: string;
  dedupKey: string;
  deviceId: string;
  tsUtcIso: string;
  epochMs: number;
  containerNumber: string;
  containerConfidence: number;
  telemetry?: Telemetry;
  correlation: CorrelationResult;
  artifacts: ArtifactsState;
  integrity: {
    isoStatus: "valid" | "corrected" | "invalid";
    correctionApplied?: string;
  };
};

export type LogEntry = {
  t: number;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  component:
    | "RTSP"
    | "DETECTOR"
    | "CROPPER"
    | "V2H"
    | "OCR"
    | "ISO"
    | "TELEMETRY"
    | "CORRELATOR"
    | "SYSTEM";
  msg: string;
  data?: Record<string, unknown>;
};

export type MetricsSnapshot = {
  t: number;
  fps: number;
  rtspDrops: number;
  rtspFreezes: number;
  detectionsPerMin: number;
  ocrSuccessRate: number;
  isoValidRate: number;
  apiRetryRate: number;
  correlationSuccessRate: number;
  endToEndLatencyMsP50: number;
};

export type PipelineState = {
  state: PipelineLifecycleState;
  nowMs: number;
  frame?: FrameEvent;
  detections: Detection[];
  artifacts: ArtifactsState;
  ocr?: OcrResult;
  validation?: IsoValidationResult;
  telemetryLatest?: Telemetry;
  correlation?: CorrelationResult;
};
