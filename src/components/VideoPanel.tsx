import { useDemoStore } from "../store/useDemoStore";
import { Detection, PipelineLifecycleState } from "../sim/types";

/**
 * VideoPanel - Displays the latest frame with OBB overlays and status indicator.
 * This is a whitebox overlay component showing what the ML pipeline "sees".
 */
export default function VideoPanel() {
  const frame = useDemoStore((s) => s.pipeline.frame);
  const detections = useDemoStore((s) => s.pipeline.detections);
  const pipelineState = useDemoStore((s) => s.pipeline.state);
  const validation = useDemoStore((s) => s.pipeline.validation);

  // Status indicator colors and text
  const getStatusIndicator = (state: PipelineLifecycleState) => {
    const configs: Partial<Record<PipelineLifecycleState, { color: string; bg: string; text: string }>> = {
      Validated: { color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40", text: "✓ Validated" },
      Corrected: { color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40", text: "⚠ Corrected" },
      Sent: { color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/40", text: "↑ Sent" },
      Correlated: { color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/40", text: "⚡ Correlated" },
      Archived: { color: "text-slate-400", bg: "bg-slate-500/20 border-slate-500/40", text: "📦 Archived" },
      Rejected: { color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", text: "✗ Rejected" }
    };
    return configs[state];
  };

  const statusIndicator = getStatusIndicator(pipelineState);

  // Draw OBB as rotated rectangle path
  const renderObbOverlay = (det: Detection, index: number) => {
    const { obb, cls, conf } = det;
    const { cx, cy, w, h, angleDeg } = obb;

    // Class colors
    const classColors: Record<string, string> = {
      horizontal_owner_code: "#22c55e", // green
      horizontal_identification_number: "#3b82f6", // blue
      vertical_identification_number: "#f59e0b" // amber
    };

    const color = classColors[cls] || "#94a3b8";

    // Create rotated rectangle points
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const hw = w / 2;
    const hh = h / 2;

    // Corner offsets before rotation
    const corners = [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh]
    ];

    // Rotate corners around center
    const rotated = corners.map(([dx, dy]) => [
      cx + dx * cos - dy * sin,
      cy + dx * sin + dy * cos
    ]);

    const pathD = `M ${rotated[0][0]} ${rotated[0][1]} L ${rotated[1][0]} ${rotated[1][1]} L ${rotated[2][0]} ${rotated[2][1]} L ${rotated[3][0]} ${rotated[3][1]} Z`;

    // Label position (top-left of rotated box)
    const labelX = Math.min(...rotated.map(p => p[0]));
    const labelY = Math.min(...rotated.map(p => p[1])) - 4;

    const shortCls = cls.replace("horizontal_", "H:").replace("vertical_", "V:").replace("_code", "").replace("_number", "");

    return (
      <g key={`det-${index}`}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.9}
        />
        <rect
          x={labelX}
          y={labelY - 14}
          width={80}
          height={16}
          fill={color}
          opacity={0.85}
          rx={2}
        />
        <text
          x={labelX + 4}
          y={labelY - 2}
          fill="white"
          fontSize={10}
          fontWeight={600}
          fontFamily="ui-monospace, monospace"
        >
          {shortCls} {(conf * 100).toFixed(0)}%
        </text>
      </g>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm text-slate-400">Video Feed</div>
          <div className="text-lg font-semibold">Frame Preview + OBB Overlay</div>
        </div>
        {statusIndicator && (
          <div className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${statusIndicator.bg} ${statusIndicator.color}`}>
            {statusIndicator.text}
            {validation?.acceptedValue && (
              <span className="ml-2 font-mono text-xs opacity-80">{validation.acceptedValue}</span>
            )}
          </div>
        )}
      </div>

      <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
        {frame ? (
          <div className="relative" key={frame.frameId}>
            <img
              key={`img-${frame.frameId}`}
              src={frame.imageDataUrl}
              alt={`Frame ${frame.frameId}`}
              className="w-full h-auto block"
              style={{ imageRendering: "pixelated" }}
            />
            {/* SVG Overlay for OBBs */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${frame.width} ${frame.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {detections.map((det, i) => renderObbOverlay(det, i))}
            </svg>
            {/* Frame info overlay */}
            <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1 text-xs font-mono text-slate-300">
              Frame #{frame.frameId} | {frame.width}×{frame.height} | t={frame.t.toFixed(0)}ms
            </div>
            {/* Ground truth debug (optional) */}
            <div className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1 text-xs font-mono text-slate-400">
              GT: {frame.groundTruth.containerNumber} ({frame.groundTruth.textOrientation})
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-slate-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📹</div>
              <div className="text-sm">No frame yet. Start the simulation.</div>
            </div>
          </div>
        )}
      </div>

      {/* Detection summary */}
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          Owner Code
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          ID Number
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Vertical ID
        </div>
        <div className="ml-auto text-slate-500">
          {detections.length} detection{detections.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
