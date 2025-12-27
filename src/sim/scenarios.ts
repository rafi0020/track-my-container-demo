import { DemoScenarioId, DemoToggles } from "./types";

export type ScenarioDef = {
  id: DemoScenarioId;
  title: string;
  description: string;
  icon: string;
  durationMs: number;
  narrative: string[];
  seed: number;
  baselineToggles: DemoToggles;
};

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "horizontal_id_capture",
    title: "Horizontal ID Capture",
    description: "Container ID displayed horizontally (standard orientation)",
    icon: "📦",
    durationMs: 60_000,
    seed: 101,
    baselineToggles: {
      rtspInstability: false,
      fisheyeDistortion: true,
      verticalId: false,
      glareNight: false,
      fadedText: false,
      operatorMistakes: false,
      gateSideIssues: false,
      correlationModeBackend: true
    },
    narrative: [
      "Container ID is displayed in standard horizontal orientation.",
      "Edge detects OBB regions, pairs owner code + digits, runs OCR.",
      "ISO 6346 validation confirms the container number.",
      "Telemetry is correlated and a fused event is created."
    ]
  },
  {
    id: "vertical_id_capture",
    title: "Vertical ID Capture",
    description: "Container ID displayed vertically (stacked orientation)",
    icon: "📋",
    durationMs: 60_000,
    seed: 202,
    baselineToggles: {
      rtspInstability: false,
      fisheyeDistortion: true,
      verticalId: true,
      glareNight: false,
      fadedText: false,
      operatorMistakes: false,
      gateSideIssues: false,
      correlationModeBackend: true
    },
    narrative: [
      "Container ID is displayed in vertical (stacked) orientation.",
      "Edge routes crops through V2H (vertical-to-horizontal) reconstruction.",
      "OCR reads the reconstructed horizontal strip, validates via ISO 6346.",
      "Telemetry is correlated and a fused event is created."
    ]
  }
];

export function getScenario(id: DemoScenarioId): ScenarioDef {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}
