import { SCENARIOS } from "../sim/scenarios";
import { useDemoStore } from "../store/useDemoStore";

export default function ScenarioPlayer(props: { onApplyScenario: () => void }) {
  const scenarioId = useDemoStore((s) => s.scenarioId);
  const setScenario = useDemoStore((s) => s.setScenario);

  const scenario = SCENARIOS.find((x) => x.id === scenarioId)!;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Scenario</div>
          <div className="text-lg font-semibold">{scenario.title}</div>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Select scenario"
            value={scenarioId}
            onChange={(e) => setScenario(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <button
            onClick={props.onApplyScenario}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-300">
        {scenario.narrative.map((line, i) => (
          <div key={i} className="leading-relaxed">
            • {line}
          </div>
        ))}
      </div>
    </div>
  );
}
