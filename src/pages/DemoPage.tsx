import { useEffect, useRef } from "react";
import ScenarioSelector from "../components/ScenarioSelector";
import PlaybackControls from "../components/PlaybackControls";
import PipelineStepper from "../components/PipelineStepper";
import StateMachineView from "../components/StateMachineView";
import ArtifactsViewer from "../components/ArtifactsViewer";
import LogsConsole from "../components/LogsConsole";
import DashboardPanel from "../components/DashboardPanel";
import ContainerDetailModal from "../components/ContainerDetailModal";
import VideoPanel from "../components/VideoPanel";
import Iso6346Panel from "../components/Iso6346Panel";
import { useDemoStore } from "../store/useDemoStore";
import { DemoEngine } from "../sim/engine";
import { getScenario } from "../sim/scenarios";
import { DemoScenarioId, PipelineLifecycleState } from "../sim/types";

// Define pipeline state priorities - higher priority states should not be overwritten by lower ones
const STATE_PRIORITY: Record<PipelineLifecycleState, number> = {
  Idle: 0,
  Candidate: 1,
  OCR_Processing: 2,
  Validated: 3,
  Corrected: 3,
  Rejected: 3,
  Sent: 4,
  Correlated: 5,
  Archived: 6,
  Dropped: 0,
  Error: 0
};

export default function DemoPage() {
  const engineRef = useRef<DemoEngine | null>(null);

  const scenarioId = useDemoStore((s) => s.scenarioId);
  const toggles = useDemoStore((s) => s.toggles);
  const speed = useDemoStore((s) => s.speed);
  const isRunning = useDemoStore((s) => s.isRunning);

  const setScenario = useDemoStore((s) => s.setScenario);
  const setRunning = useDemoStore((s) => s.setRunning);
  const resetSession = useDemoStore((s) => s.resetSession);
  const pushLog = useDemoStore((s) => s.pushLog);
  const pushMetrics = useDemoStore((s) => s.pushMetrics);
  const pushEvent = useDemoStore((s) => s.pushEvent);
  const setPipeline = useDemoStore((s) => s.setPipeline);

  // Create engine once
  useEffect(() => {
    const engine = new DemoEngine({
      scenarioId,
      toggles,
      speed,
      deviceId: "CRANE07"
    });

    engineRef.current = engine;

    // Helper to conditionally update state only if new state has higher priority
    const updateStateIfHigher = (newState: PipelineLifecycleState) => {
      const current = useDemoStore.getState().pipeline.state as PipelineLifecycleState;
      if (STATE_PRIORITY[newState] >= STATE_PRIORITY[current]) {
        setPipeline({ state: newState });
      }
    };

    const offLog = engine.on("log", (l) => pushLog(l));
    const offMetrics = engine.on("metrics", (m) => pushMetrics(m));
    
    // frame event: only updates frame preview and time, not state
    const offFrame = engine.on("frame", (f) => {
      setPipeline({ nowMs: f.t, frame: f });
    });

    // detections event: updates detection list and state (Idle if none, else Candidate)
    const offDet = engine.on("detections", (dets) => {
      setPipeline({ detections: dets });
      if (dets.length === 0) {
        // Only go to Idle if we're still in early pipeline states
        const current = useDemoStore.getState().pipeline.state as PipelineLifecycleState;
        if (STATE_PRIORITY[current] <= STATE_PRIORITY["Candidate"]) {
          setPipeline({ state: "Idle" });
        }
      } else {
        updateStateIfHigher("Candidate");
      }
    });

    // artifacts event: sets state to OCR_Processing
    const offArtifacts = engine.on("artifacts", (payload) => {
      setPipeline({ artifacts: payload.artifacts });
      updateStateIfHigher("OCR_Processing");
    });

    // v2h event: adds v2h strip to artifacts
    const offV2H = engine.on("v2h", (payload) => {
      const currentArtifacts = useDemoStore.getState().pipeline.artifacts;
      setPipeline({ 
        artifacts: { ...currentArtifacts, v2hStrip: payload.strip }
      });
      updateStateIfHigher("OCR_Processing");
    });

    // ocr event: sets state to Validated/Corrected/Rejected
    const offOcr = engine.on("ocr", (payload) => {
      const newState: PipelineLifecycleState = payload.validation.acceptedValue 
        ? (payload.validation.corrected ? "Corrected" : "Validated") 
        : "Rejected";
      setPipeline({
        ocr: payload.ocr,
        validation: payload.validation,
        state: newState
      });
    });

    // containerId event: sets state to Sent
    const offContainerId = engine.on("containerId", () => {
      updateStateIfHigher("Sent");
    });

    // telemetryLatest event: updates latest telemetry
    const offTelemetryLatest = engine.on("telemetryLatest", (tel) => {
      setPipeline({ telemetryLatest: tel });
    });

    // correlation event: sets state to Correlated if success, else stays Sent
    const offCorrelation = engine.on("correlation", (corr) => {
      setPipeline({ correlation: corr });
      if (corr.success) {
        updateStateIfHigher("Correlated");
      }
    });

    // fusedEvent: sets state to Archived
    const offFused = engine.on("fusedEvent", (evt) => {
      pushEvent(evt);
      updateStateIfHigher("Archived");
    });

    // Cleanup
    return () => {
      offLog();
      offMetrics();
      offFrame();
      offDet();
      offArtifacts();
      offV2H();
      offOcr();
      offContainerId();
      offTelemetryLatest();
      offCorrelation();
      offFused();
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update running
  useEffect(() => {
    engineRef.current?.setRunning(isRunning);
  }, [isRunning]);

  // Update speed
  useEffect(() => {
    engineRef.current?.setSpeed(speed);
  }, [speed]);

  // Update toggles live
  useEffect(() => {
    engineRef.current?.updateToggles(toggles);
  }, [toggles]);

  function handleScenarioSelect(id: DemoScenarioId) {
    const s = getScenario(id);

    // Stop current simulation first
    setRunning(false);

    // Update scenario in store
    setScenario(id);

    // Apply all scenario baseline toggles automatically
    Object.entries(s.baselineToggles).forEach(([k, v]) => {
      useDemoStore.getState().setToggle(k as keyof typeof toggles, Boolean(v));
    });

    // Reset UI state
    resetSession();
    
    // Reset and update engine with new scenario
    engineRef.current?.updateScenario(id);
    engineRef.current?.updateToggles(s.baselineToggles as any);

    pushLog({
      t: 0,
      component: "SYSTEM",
      level: "INFO",
      msg: `Scenario "${s.title}" selected`,
      data: { scenarioId: id }
    });
  }

  function handleReset() {
    // Synchronously reset everything in correct order:
    // 1. Stop engine and reset its internal state
    if (engineRef.current) {
      engineRef.current.reset();
    }
    // 2. Reset store state (pipeline, logs, events, and isRunning=false)
    resetSession();
    // 3. Log the reset
    pushLog({ t: 0, component: "SYSTEM", level: "INFO", msg: "Session reset" });
  }

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <ScenarioSelector onSelect={handleScenarioSelect} />

      {/* Playback Controls */}
      <PlaybackControls
        onStart={() => setRunning(true)}
        onStop={() => setRunning(false)}
        onReset={handleReset}
      />

      {/* Main visualization area */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <VideoPanel />
        <div className="space-y-4">
          <PipelineStepper />
          <StateMachineView />
        </div>
      </div>

      {/* Results */}
      <DashboardPanel />

      {/* ISO 6346 Validation & Artifacts - side by side */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Iso6346Panel />
        <ArtifactsViewer />
      </div>

      {/* Logs */}
      <LogsConsole />

      <ContainerDetailModal />
    </div>
  );
}
