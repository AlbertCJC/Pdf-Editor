import { FC, useCallback, useRef, useState } from 'react';
import { pageToDataUrl } from '../lib/pdf';
import { Spinner } from './ui';

const BORDER = "#27272a";
const ACCENT = "#f97316";

interface PdfUploaderProps {
  onLoaded: (pages: any[], bytes: Uint8Array) => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;
}

export const PdfUploader: FC<PdfUploaderProps> = ({ onLoaded, busy, setBusy }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [dragHover, setDragHover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback((file: File | null) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return setError("Invalid file type. Please select a PDF.");
    }

    setError(null);
    setBusy(true);

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const buf = event.target!.result as ArrayBuffer;
        const originalBytes = new Uint8Array(buf);
        let bytes = originalBytes;

        const pdfMagicNumber = [37, 80, 68, 70, 45]; // %PDF-
        let headerIndex = -1;
        const searchLimit = Math.min(1024, bytes.length - pdfMagicNumber.length);

        for (let i = 0; i <= searchLimit; i++) {
          let found = true;
          for (let j = 0; j < pdfMagicNumber.length; j++) {
            if (bytes[i + j] !== pdfMagicNumber[j]) {
              found = false;
              break;
            }
          }
          if (found) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex === -1) {
          throw new Error("No PDF header found within the first 1024 bytes.");
        }

        if (headerIndex > 0) {
          bytes = bytes.subarray(headerIndex);
        }

        const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
        const pages = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const { dataUrl, ptW, ptH } = await pageToDataUrl(pg);
          pages.push({ id: `p${i}-${Date.now()}`, originalIndex: i - 1, dataUrl, ptW, ptH });
        }
        
        onLoaded(pages, originalBytes);
      } catch (e: any) {
        console.error("PDF Parsing Error:", e);
        if (e.message && (e.message.includes("No PDF header found") || e.message.includes("Invalid PDF structure"))) {
          setError("Invalid PDF: File may be corrupt or not a valid PDF. Please try another file.");
        } else {
          setError(`Could not parse PDF: ${e.message}`);
        }
      } finally {
        setBusy(false);
      }
    };

    reader.onerror = () => {
      setError("An error occurred while reading the file.");
      setBusy(false);
    };

    reader.readAsArrayBuffer(file);
  }, [onLoaded, setBusy]);

  return (
    <div
      style={{ ...css.dropzone, ...(dragHover ? css.dropzoneHover : {}) }}
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragHover(true); }}
      onDragLeave={() => setDragHover(false)}
      onDrop={e => { e.preventDefault(); setDragHover(false); process(e.dataTransfer.files[0]); }}
    >
      <input ref={ref} type="file" accept="application/pdf" style={{ display: "none" }}
        onChange={e => process(e.target.files[0])} />
      {busy ? (
        <Spinner />
      ) : error ? (
        <div style={css.uploadError}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div>{error}</div>
        </div>
      ) : (
        <>
          <div style={css.uploadIcon}>⧉</div>
          <p style={css.uploadTitle}>Drop a PDF or click to browse</p>
          <p style={css.uploadSub}>Multi-page PDFs supported</p>
        </>
      )}
    </div>
  );
}

const css = {
  dropzone: {
    width: 420, border: `1.5px dashed ${BORDER}`, borderRadius: 12,
    padding: "56px 40px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 12, cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    animation: "fadeUp 0.4s ease",
  },
  dropzoneHover: { borderColor: ACCENT, background: "#1c1414" },
  uploadIcon: { fontSize: 52, color: ACCENT, lineHeight: 1 },
  uploadTitle: { fontSize: 15, color: "#a1a1aa", textAlign: "center" as const },
  uploadSub:   { fontSize: 11, color: "#52525b", textAlign: "center" as const },
  uploadError: { 
    color: "#f87171", 
    textAlign: "center" as const,
    fontSize: 13,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
  },
};
