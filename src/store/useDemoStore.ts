import { create } from "zustand";
import { DemoScenarioId, DemoToggles, FusedEvent, LogEntry, MetricsSnapshot, PipelineState, SimSpeed } from "../sim/types";

type DemoStore = {
  scenarioId: DemoScenarioId;
  toggles: DemoToggles;
  speed: SimSpeed;
  isRunning: boolean;
  stepMode: boolean;

  pipeline: PipelineState;
  logs: LogEntry[];
  metrics: MetricsSnapshot[];
  events: FusedEvent[];
  selectedEventId?: string;

  setScenario: (id: DemoScenarioId) => void;
  setToggle: (k: keyof DemoToggles, v: boolean) => void;
  setSpeed: (s: SimSpeed) => void;
  setRunning: (v: boolean) => void;
  setStepMode: (v: boolean) => void;

  pushLog: (l: LogEntry) => void;
  pushMetrics: (m: MetricsSnapshot) => void;
  pushEvent: (e: FusedEvent) => void;
  setPipeline: (p: Partial<PipelineState>) => void;
  resetSession: () => void;

  selectEvent: (id?: string) => void;
};

const defaultToggles: DemoToggles = {
  rtspInstability: false,
  fisheyeDistortion: true,
  verticalId: false,
  glareNight: false,
  fadedText: false,
  operatorMistakes: false,
  gateSideIssues: false,
  correlationModeBackend: true
};

const defaultPipeline: PipelineState = {
  state: "Idle",
  nowMs: 0,
  frame: undefined,
  detections: [],
  artifacts: {},
  ocr: undefined,
  validation: undefined,
  telemetryLatest: undefined,
  correlation: undefined
};

export const useDemoStore = create<DemoStore>((set, get) => ({
  scenarioId: "horizontal_id_capture",
  toggles: defaultToggles,
  speed: 1,
  isRunning: false,
  stepMode: false,

  pipeline: defaultPipeline,
  logs: [],
  metrics: [],
  events: [],
  selectedEventId: undefined,

  setScenario: (id) => set({ scenarioId: id }),
  setToggle: (k, v) => set({ toggles: { ...get().toggles, [k]: v } }),
  setSpeed: (s) => set({ speed: s }),
  setRunning: (v) => set({ isRunning: v }),
  setStepMode: (v) => set({ stepMode: v }),

  pushLog: (l) => {
    const logs = get().logs;
    const next = logs.length > 500 ? logs.slice(logs.length - 500) : logs;
    set({ logs: [...next, l] });
  },

  pushMetrics: (m) => {
    const ms = get().metrics;
    const next = ms.length > 300 ? ms.slice(ms.length - 300) : ms;
    set({ metrics: [...next, m] });
  },

  pushEvent: (e) => set({ events: [e, ...get().events].slice(0, 200) }),

  setPipeline: (p) => set({ pipeline: { ...get().pipeline, ...p } }),

  resetSession: () =>
    set({
      isRunning: false,
      pipeline: { ...defaultPipeline },
      logs: [],
      metrics: [],
      events: [],
      selectedEventId: undefined
    }),

  selectEvent: (id) => set({ selectedEventId: id })
}));
