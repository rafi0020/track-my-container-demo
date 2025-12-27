import { useDemoStore } from "../store/useDemoStore";

function ImgCard(props: { title: string; dataUrl?: string; meta?: Record<string, any>; artifactKey?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="text-sm font-semibold">{props.title}</div>
      <div className="mt-2 aspect-[16/6] overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        {props.dataUrl ? (
          <img 
            key={props.artifactKey || props.dataUrl?.slice(-20)} 
            src={props.dataUrl} 
            alt={props.title} 
            className="h-full w-full object-contain" 
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">No artifact</div>
        )}
      </div>
      <div className="mt-2 text-xs text-slate-400">
        {props.meta ? (
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(props.meta, null, 2)}</pre>
        ) : (
          "—"
        )}
      </div>
    </div>
  );
}

export default function ArtifactsViewer() {
  const p = useDemoStore((s) => s.pipeline);
  const nowMs = useDemoStore((s) => s.pipeline.nowMs);

  const artifacts = p.artifacts;
  
  // Generate a unique key suffix based on time to force re-renders
  const keyPrefix = `${Math.floor(nowMs / 100)}`;
  
  const rows = [
    { key: "ownerCrop", title: "Owner Crop", a: artifacts.ownerCrop },
    { key: "numberCrop", title: "Digits Crop", a: artifacts.numberCrop },
    { key: "pairedCrop", title: "Paired Crop", a: artifacts.pairedCrop },
    { key: "verticalCrop", title: "Vertical Crop", a: artifacts.verticalCrop },
    { key: "v2hStrip", title: "V2H Strip", a: artifacts.v2hStrip }
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-sm text-slate-400">Artifacts Viewer</div>
      <div className="text-lg font-semibold">Internal Images (Crops, Pairing, V2H)</div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <ImgCard 
            key={r.key} 
            title={r.title} 
            dataUrl={r.a?.dataUrl} 
            meta={r.a?.meta}
            artifactKey={`${r.key}-${keyPrefix}`}
          />
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
        <div className="text-sm font-semibold">OCR + ISO Outcome</div>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="text-sm">
            <div className="text-slate-400">Raw OCR</div>
            <div className="font-mono text-slate-100">{p.ocr?.rawText ?? "—"}</div>
            <div className="text-xs text-slate-400">Confidence: {p.ocr ? p.ocr.confidence.toFixed(2) : "—"} | Source: {p.ocr?.source ?? "—"}</div>
          </div>
          <div className="text-sm">
            <div className="text-slate-400">ISO Validation</div>
            <div className="font-mono text-slate-100">{p.validation?.acceptedValue ?? "—"}</div>
            <div className="text-xs text-slate-400">
              Regex: {String(p.validation?.isRegexOk ?? "—")} | Check: {String(p.validation?.isCheckDigitOk ?? "—")}
            </div>
            <div className="text-xs text-slate-400">
              Correction: {p.validation?.corrected ? `${p.validation.corrected.value} (${p.validation.corrected.reason})` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
