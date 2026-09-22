// js/ocr-worker.js
// Runs Tesseract OCR off the main thread so the UI stays responsive.

importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js');

let worker = null;
let busy = false;

async function ensureWorker() {
  if (worker) return worker;
  worker = await Tesseract.createWorker('eng', 1, {
    logger: (m) => {
      if (m.status && typeof m.progress === 'number') {
        self.postMessage({
          type: 'progress',
          status: m.status,
          progress: m.progress
        });
      }
    }
  });
  return worker;
}

self.onmessage = async (e) => {
  const { type, bitmap, pageIndex } = e.data;

  if (type === 'recognize') {
    if (busy) {
      self.postMessage({ type: 'error', pageIndex, message: 'Worker busy' });
      return;
    }
    busy = true;
    try {
      const w = await ensureWorker();
      const { data: { text } } = await w.recognize(bitmap);
      if (bitmap && typeof bitmap.close === 'function') bitmap.close();
      self.postMessage({ type: 'result', pageIndex, text });
    } catch (err) {
      self.postMessage({ type: 'error', pageIndex, message: err.message || String(err) });
    } finally {
      busy = false;
    }
  } else if (type === 'terminate') {
    if (worker) {
      try { await worker.terminate(); } catch (e) {}
      worker = null;
    }
    self.close();
  }
};
