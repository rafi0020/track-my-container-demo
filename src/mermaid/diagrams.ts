export const DIAGRAM_COMPONENT_ARCH = `
graph LR
  subgraph Yard["Depot / Yard"]
    CAM["RTSP Camera (Fisheye)"]
    EDGE["Edge ML Runtime\\nYOLO OBB + Crops\\nV2H + OCR + ISO"]
    ESP["ESP32 IoT\\nGPS + SONAR + Height\\nPick/Drop"]
  end
  subgraph Cloud["Backend + Dashboard"]
    API["Ingestion API\\nTelemetry + Container-ID"]
    DB["DB\\nEvents + Reference"]
    UI["Dashboard UI"]
  end

  CAM -->|RTSP| EDGE
  ESP -->|Telemetry| API
  EDGE -->|Container ID| API
  API --> DB
  DB --> UI
`;

export const DIAGRAM_SEQUENCE = `
sequenceDiagram
  autonumber
  participant CAM as RTSP
  participant EDGE as Edge ML
  participant V2H as ver_to_hor
  participant OCR as OCR+ISO
  participant ESP as ESP32
  participant API as Backend
  participant UI as Dashboard

  ESP->>API: Telemetry stream
  CAM->>EDGE: Frames
  EDGE->>EDGE: Undistort + Detect (OBB) + Crop
  EDGE->>V2H: Vertical crop (if needed)
  V2H->>OCR: Reconstructed strip
  EDGE->>OCR: Paired crop
  OCR->>OCR: Validate ISO + Correct
  OCR->>API: Container-ID event
  API->>API: Correlate (±3s) or bundle
  API->>UI: Show fused event
`;

export const DIAGRAM_STATE = `
stateDiagram-v2
  [*] --> Idle
  Idle --> Candidate: detections/crops
  Candidate --> OCR_Processing
  OCR_Processing --> Validated: ISO OK
  OCR_Processing --> Corrected: correction applied
  Corrected --> Validated
  OCR_Processing --> Rejected: invalid
  Validated --> Sent
  Sent --> Correlated
  Correlated --> Archived
  Rejected --> Idle
  Archived --> Idle
`;
