export const THUMB_PX = 150;

function loadScript(src: string, globalCheck: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window[globalCheck]) return resolve();
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = Object.assign(document.createElement("script"), { src });
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export async function ensureLibs() {
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    "pdfjsLib"
  );
  // In a restricted iframe, the cross-origin worker may be blocked.
  // Disabling it forces parsing on the main thread.
  // window.pdfjsLib.GlobalWorkerOptions.workerSrc =
  //   "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  await loadScript(
    "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
    "PDFLib"
  );
}

export async function pageToDataUrl(pdfjsPage: any): Promise<{ dataUrl: string; ptW: number; ptH: number }> {
  const vp0 = pdfjsPage.getViewport({ scale: 1 });
  const scale = THUMB_PX / Math.max(vp0.width, vp0.height);
  const vp = pdfjsPage.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  await pdfjsPage.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), ptW: vp0.width, ptH: vp0.height };
}

export async function generateNUp(pages: any[], rawBytes: Uint8Array, cols: number, rows: number, sizeName: string): Promise<Uint8Array> {
  const { PDFDocument } = window.PDFLib;

  // Use a copy of the buffer, as pdf-lib can modify it
  const srcDoc = await PDFDocument.load(rawBytes.slice(0));
  const outDoc = await PDFDocument.create();

  // A4 landscape in points
  const OUT_W = 841.89, OUT_H = 595.28;
  const cellW = OUT_W / cols;
  const cellH = OUT_H / rows;
  const slots = cols * rows;
  const numSheets = Math.ceil(pages.length / slots);

  for (let sheet = 0; sheet < numSheets; sheet++) {
    const outPage = outDoc.addPage([OUT_W, OUT_H]);

    for (let slot = 0; slot < slots; slot++) {
      const pageIdx = sheet * slots + slot;
      if (pageIdx >= pages.length) break;

      const srcPageNum = pages[pageIdx].originalIndex;
      const [embedded] = await outDoc.embedPdf(srcDoc, [srcPageNum]);

      const col = slot % cols;
      const row = Math.floor(slot / cols);

      const scale = Math.min(cellW / embedded.width, cellH / embedded.height);
      const scaledW = embedded.width * scale;
      const scaledH = embedded.height * scale;

      const x = col * cellW + (cellW - scaledW) / 2;
      const y = OUT_H - (row + 1) * cellH + (cellH - scaledH) / 2;

      outPage.drawPage(embedded, { x, y, width: scaledW, height: scaledH });
    }
  }

  return outDoc.save();
}
