import { FC, useState, useEffect } from 'react';

import { generateNUp } from '../lib/pdf';
import { ACCENT, BORDER, NumInput, Row, Spinner, SURFACE } from './ui';

interface PdfGeneratorProps {
  pages: any[];
  rawBytes: Uint8Array | null;
}

export const PdfGenerator: FC<PdfGeneratorProps> = ({ pages, rawBytes }) => {
  const [cols, setCols]     = useState(2);
  const [rows, setRows]     = useState(2);
  const [size, setSize]     = useState("A4");
  const [busy, setBusy]     = useState(false);
  const [progress, setProgress] = useState("");

  const slots  = cols * rows;
  const sheets = Math.ceil(pages.length / slots);

  useEffect(() => {
    console.log(`PdfGenerator received rawBytes. Length: ${rawBytes?.byteLength ?? 'undefined'}`);
  }, [rawBytes]);

  const handleExport = async () => {
    if (!rawBytes || rawBytes.byteLength === 0) {
      console.warn("Export aborted: rawBytes is empty or undefined.");
      return;
    }
    setBusy(true);
    setProgress("Building PDF…");
    try {
      const out = await generateNUp(pages, rawBytes, cols, rows, size);
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setProgress("Done ✓");
      setTimeout(() => setProgress(""), 2000);
    } catch (e) {
      const error = e instanceof Error ? e : new Error('An unknown error occurred');
      console.error("PDF Generation Error:", error);
      setProgress(`Error: Could not generate PDF.`);
      setTimeout(() => setProgress(""), 4000); // Clear error after a few seconds
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={css.panel}>
      <div style={css.panelHeader}>
        <span style={{ color: ACCENT }}>◈</span> N-Up Export
      </div>

      <Row label="Columns">
        <NumInput value={cols} min={1} max={8} onChange={setCols} />
      </Row>
      <Row label="Rows">
        <NumInput value={rows} min={1} max={8} onChange={setRows} />
      </Row>
      <Row label="Page size">
        <select value={size} onChange={e => setSize(e.target.value)} style={css.select}>
          <option>A4</option><option>Letter</option>
        </select>
      </Row>

      <div style={css.stat}>
        {slots} slot{slots !== 1 ? "s" : ""}/sheet → <b style={{ color: "#e4e4e7" }}>{sheets}</b> sheet{sheets !== 1 ? "s" : ""}
      </div>

      <button onClick={handleExport} disabled={busy || pages.length === 0} style={css.btn}>
        {busy ? <Spinner small /> : `⬇ Export ${cols}×${rows} PDF`}
      </button>

      {progress && <div style={css.progress}>{progress}</div>}

      <details style={{ marginTop: 20 }}>
        <summary style={css.noteHead}>⚡ Performance Notes</summary>
        <div style={css.noteBody}>
          <b>Canvas memory:</b> each thumbnail is width×height×4 bytes. At 150px, 200 pages ≈ 18 MB — fine. For 500+ pages, virtualise the grid and destroy off-screen canvases.<br /><br />
          <b>Main-thread generation:</b> pdf-lib is synchronous JS. Under ~50 pages freezes are imperceptible. Beyond that, offload to a <b>Web Worker</b> and pass <code>rawBytes</code> as a <em>Transferable</em> (zero-copy) to keep the UI at 60 fps.
        </div>
      </details>
    </div>
  );
}

const css = {
  panel: { padding: 20, display: "flex", flexDirection: "column" as const },
  panelHeader: {
    fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" as const,
    color: "#71717a", marginBottom: 18, paddingBottom: 12,
    borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 8, alignItems: "center",
  },
  stat: { fontSize: 11, color: "#52525b", margin: "10px 0 14px" },
  btn: {
    background: ACCENT, color: "#fff", border: "none", padding: "11px 0",
    cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
    fontWeight: 700, letterSpacing: "0.08em", borderRadius: 6, width: "100%",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "opacity 0.15s",
  },
  progress: { marginTop: 10, fontSize: 11, color: "#71717a", textAlign: "center" as const },
  select: {
    background: SURFACE, border: `1px solid ${BORDER}`, color: "#e4e4e7",
    padding: "5px 8px", fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12, borderRadius: 4, outline: "none",
  },
  noteHead: { fontSize: 11, color: "#52525b", cursor: "pointer", letterSpacing: "0.08em", listStyle: "none" as const },
  noteBody: { marginTop: 10, fontSize: 11, lineHeight: 1.8, color: "#52525b" },
};
