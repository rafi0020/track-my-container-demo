import { useEffect, useMemo, useState } from "react";
import mermaid from "mermaid";

export default function MermaidDiagram(props: { title: string; code: string }) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
  }, []);

  const id = useMemo(() => `mmd_${Math.random().toString(16).slice(2)}`, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { svg } = await mermaid.render(id, props.code);
        if (!cancelled) setSvg(svg);
      } catch (e: any) {
        if (!cancelled) setSvg(`<pre style="color:#fca5a5">Mermaid render error: ${String(e?.message ?? e)}</pre>`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, props.code]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-sm text-slate-400">Mermaid Diagram</div>
      <div className="text-lg font-semibold">{props.title}</div>

      <div className="mt-3 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}
