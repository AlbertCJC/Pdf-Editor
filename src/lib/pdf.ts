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
  const SIZES: Record<string, [number, number]> = { A4: [595.28, 841.89], Letter: [612, 792] };
  const [W, H] = SIZES[sizeName] ?? SIZES.A4;
  const cellW = W / cols, cellH = H / rows;
  const slots = cols * rows;

  const srcDoc = await PDFDocument.load(rawBytes);
  const outDoc = await PDFDocument.create();

  for (let base = 0; base < pages.length; base += slots) {
    const outPage = outDoc.addPage([W, H]);
    const chunk = pages.slice(base, base + slots);

    for (let si = 0; si < chunk.length; si++) {
      const pg = chunk[si];
      const [emb] = await outDoc.embedPdf(srcDoc, [pg.originalIndex]);
      const { width: ptW, height: ptH } = emb.scale(1);

      const col = si % cols;
      const row = Math.floor(si / cols);
      const cx = col * cellW;
      const cy = H - (row + 1) * cellH;

      const s = Math.min(cellW / ptW, cellH / ptH);
      const drawX = cx + (cellW - ptW * s) / 2;
      const drawY = cy + (cellH - ptH * s) / 2;

      outPage.drawPage(emb, { x: drawX, y: drawY, width: ptW * s, height: ptH * s });
    }
  }
  return outDoc.save();
}
