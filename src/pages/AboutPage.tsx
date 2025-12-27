import MermaidDiagram from "../components/MermaidDiagram";
import { DIAGRAM_COMPONENT_ARCH, DIAGRAM_SEQUENCE, DIAGRAM_STATE } from "../mermaid/diagrams";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      {/* Main Description */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm text-slate-400">What this demo represents</div>
        <div className="mt-1 text-2xl font-semibold">Track My Container — Real System, Simulated Transparently</div>

        <div className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            This is a <span className="font-semibold">static, client-side simulation</span> designed for portfolio demonstration.
            It mirrors the real deployed architecture:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>RTSP ingest on edge (Jetson-class) hardware</li>
            <li>YOLO OBB detection and crop extraction</li>
            <li>Horizontal pairing of owner code + identification digits</li>
            <li>Vertical-to-horizontal reconstruction (ver_to_hor concept)</li>
            <li>PaddleOCR recognition-only behavior (simulated)</li>
            <li>ISO 6346 validation + intelligent correction + prefix allowlist</li>
            <li>ESP32 telemetry (GPS, SONAR/height, pick/drop events)</li>
            <li>Backend correlation vs edge bundling (toggle in demo)</li>
          </ul>

          <p>
            The whitebox panels show internal artifacts, logs, lifecycle states, and metrics—so a reviewer can see how the system behaves under
            real-world constraints: RTSP jitter/freezes, fisheye distortion, vertical IDs, glare at night, faded text, operator mistakes, and gate-side network/power issues.
          </p>

          <p className="text-xs text-slate-400">
            Disclaimer: No real camera streams, credentials, or backend endpoints are used. All outputs are deterministic and seeded per scenario.
          </p>
        </div>
      </div>

      {/* System Architecture Diagram */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm text-slate-400">System Overview</div>
        <div className="mt-1 text-xl font-semibold">Component Architecture</div>
        <p className="mt-2 text-sm text-slate-300">
          This diagram shows the high-level architecture of the Track My Container system. The edge device processes camera frames
          using YOLO OBB for detection, crops the container ID regions, and runs OCR with ISO 6346 validation. The ESP32 IoT device
          sends GPS and telemetry data. Both streams converge at the backend for correlation and dashboard display.
        </p>
        <div className="mt-4">
          <MermaidDiagram title="" code={DIAGRAM_COMPONENT_ARCH} />
        </div>
      </div>

      {/* Sequence Diagram */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm text-slate-400">Data Flow</div>
        <div className="mt-1 text-xl font-semibold">Sequence Diagram</div>
        <p className="mt-2 text-sm text-slate-300">
          This sequence diagram illustrates the step-by-step flow of data through the system. Frames from the RTSP camera are
          processed by the edge ML runtime (undistort → detect → crop). If a vertical ID is detected, it goes through the V2H
          (vertical-to-horizontal) reconstruction. OCR validates the container number against ISO 6346 standards, and the result
          is sent to the backend where it's correlated with ESP32 telemetry within a ±3 second window.
        </p>
        <div className="mt-4">
          <MermaidDiagram title="" code={DIAGRAM_SEQUENCE} />
        </div>
      </div>

      {/* State Machine Diagram */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm text-slate-400">Pipeline Lifecycle</div>
        <div className="mt-1 text-xl font-semibold">State Machine</div>
        <p className="mt-2 text-sm text-slate-300">
          The pipeline follows a state machine pattern. Each container detection progresses through states: Idle → Candidate
          (when detections/crops are found) → OCR_Processing → Validated/Corrected/Rejected (based on ISO 6346 check) → Sent
          (when transmitted to backend) → Correlated (when matched with telemetry) → Archived (final state). This ensures
          transparent tracking of each detection's lifecycle.
        </p>
        <div className="mt-4">
          <MermaidDiagram title="" code={DIAGRAM_STATE} />
        </div>
      </div>

      {/* ISO 6346 Explanation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm text-slate-400">Container Identification Standard</div>
        <div className="mt-1 text-xl font-semibold">ISO 6346 Validation</div>
        <div className="mt-3 space-y-3 text-sm text-slate-300">
          <p>
            ISO 6346 is the international standard for container identification. Every shipping container has a unique
            11-character code consisting of:
          </p>
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-center">
            <span className="text-emerald-400">MSCU</span>
            <span className="text-blue-400">123456</span>
            <span className="text-amber-400">7</span>
          </div>
          <ul className="list-disc pl-6 space-y-1">
            <li><span className="text-emerald-400 font-medium">Owner Code (4 letters)</span> — Three letters for the owner + category letter (U=freight, J=detachable, Z=trailer, R=reefer)</li>
            <li><span className="text-blue-400 font-medium">Serial Number (6 digits)</span> — Unique identifier assigned by the owner</li>
            <li><span className="text-amber-400 font-medium">Check Digit (1 digit)</span> — Calculated using a weighted sum algorithm to verify the code's integrity</li>
          </ul>
          <p>
            The system validates each OCR result against this standard. If the check digit doesn't match, it attempts
            intelligent corrections (e.g., O→0, I→1, S→5) and validates against a prefix allowlist of known shipping companies.
          </p>
        </div>
      </div>
    </div>
  );
}
