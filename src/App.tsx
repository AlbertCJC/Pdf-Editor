import { useState, useEffect, useCallback } from "react";
import { ensureLibs } from "./lib/pdf";
import { PdfUploader } from "./components/PdfUploader";
import { SortableGrid } from "./components/SortableGrid";
import { PdfGenerator } from "./components/PdfGenerator";
import { Spinner } from "./components/ui";

const BG = "#09090b";
const BORDER = "#27272a";
const ACCENT = "#f97316";

export default function App() {
  const [libsReady, setLibsReady] = useState(false);
  const [libError,  setLibError]  = useState<string | null>(null);
  const [pages,     setPages]     = useState<any[]>([]);
  const [rawBytes,  setRawBytes]  = useState<Uint8Array | null>(null);
  const [busy,      setBusy]      = useState(false);

  useEffect(() => {
    ensureLibs().then(() => setLibsReady(true)).catch(e => setLibError(e.message));
  }, []);

  const onLoaded = (pgs: any[], bytes: Uint8Array) => {
    console.log(`App.onLoaded received rawBytes. Length: ${bytes?.byteLength ?? 'undefined'}`);
    setPages(pgs);
    setRawBytes(bytes);
  };

  const reset = () => { setPages([]); setRawBytes(null); };

  console.log(`App rendering with rawBytes. Length: ${rawBytes?.byteLength ?? 'undefined'}`);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG}; color: #e4e4e7; font-family: 'JetBrains Mono', monospace; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        details summary::-webkit-details-marker { display: none; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
      `}</style>

      <div style={css.root}>
        <header style={css.header}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            <span style={{ color: ACCENT }}>PDF</span> Reorder
          </span>
          <span style={{ fontSize: 11, color: "#52525b", letterSpacing: "0.12em" }}>
            N-UP LAYOUT TOOL
          </span>
          {pages.length > 0 && (
            <button onClick={reset} style={css.resetBtn}>✕ new file</button>
          )}
        </header>

        {libError && (
          <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
            Library load failed: {libError}<br/>
            <small style={{ color: "#71717a" }}>Check your connection and reload.</small>
          </div>
        )}

        {!libError && !libsReady && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
            <Spinner />
            <span style={{ color: "#52525b", fontSize: 12 }}>Loading PDF.js & pdf-lib…</span>
          </div>
        )}

        {!libError && libsReady && pages.length === 0 && (
          <div style={css.center}>
            <PdfUploader onLoaded={onLoaded} busy={busy} setBusy={setBusy} />
          </div>
        )}

        {pages.length > 0 && (
          <div style={css.workspace} key="ws">
            <main style={css.main}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                  Page Order
                </h2>
                <span style={{ fontSize: 11, color: "#52525b" }}>
                  {pages.length} pages · drag to reorder
                </span>
              </div>
              <SortableGrid pages={pages} setPages={setPages} />
            </main>
            <aside style={css.sidebar}>
              <PdfGenerator pages={pages} rawBytes={rawBytes} />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

const css = {
  root: { minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" as const },
  header: {
    display: "flex", alignItems: "center", gap: 16,
    padding: "16px 28px", borderBottom: `1px solid ${BORDER}`,
    background: "#111113",
  },
  resetBtn: {
    marginLeft: "auto", background: "transparent", border: `1px solid ${BORDER}`,
    color: "#71717a", padding: "5px 12px", cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, borderRadius: 4,
  },
  center: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 },
  workspace: { display: "flex", flex: 1, overflow: "hidden" },
  main: { flex: 1, padding: "28px 28px", overflowY: "auto", animation: "fadeUp 0.35s ease" },
  sidebar: { width: 270, borderLeft: `1px solid ${BORDER}`, background: "#111113", overflowY: "auto" },
};
