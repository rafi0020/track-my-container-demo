import { SCENARIOS } from "../sim/scenarios";
import { useDemoStore } from "../store/useDemoStore";
import { DemoScenarioId } from "../sim/types";

interface Props {
  onSelect: (id: DemoScenarioId) => void;
}

export default function ScenarioSelector({ onSelect }: Props) {
  const scenarioId = useDemoStore((s) => s.scenarioId);
  const isRunning = useDemoStore((s) => s.isRunning);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose a Scenario</h2>
        <p className="text-slate-400">Select a capture scenario to see how the system handles different conditions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCENARIOS.map((scenario) => {
          const isSelected = scenarioId === scenario.id;
          
          return (
            <button
              key={scenario.id}
              onClick={() => onSelect(scenario.id)}
              disabled={isRunning}
              className={`
                relative p-6 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected 
                  ? "border-emerald-500 bg-emerald-500/10" 
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800"
                }
                ${isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Icon and title */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{scenario.icon}</span>
                <div>
                  <h3 className="text-xl font-semibold text-white">{scenario.title}</h3>
                  <p className="text-sm text-slate-400">{scenario.description}</p>
                </div>
              </div>

              {/* What's included */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs font-medium text-slate-500 uppercase mb-2">What happens:</div>
                <ul className="space-y-1">
                  {scenario.narrative.slice(0, 2).map((line, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Show vertical ID badge for vertical scenario */}
              {/* {scenario.id === "vertical_id_capture" && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">V2H Enabled</span>
                </div>
              )} */}
            </button>
          );
        })}
      </div>

      {isRunning && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Stop the simulation to change scenarios
        </p>
      )}
    </div>
  );
}
