import * as pdfjsLib from 'pdfjs-dist';
// Vite URL import for worker
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Setup worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfConversionResult {
  pages: string[]; // Data URLs of rendered pages
  pageCount: number;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Converts a PDF File into an array of high-resolution image data URLs
 */
export async function convertPdfToImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PdfConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pageImages: string[] = [];

  let firstPageWidth = 1000;
  let firstPageHeight = 1414;

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(i, numPages);
    const page = await pdf.getPage(i);
    
    // Scale for high fidelity on 3D surfaces (around 1500px - 2000px height)
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const targetHeight = 1800;
    const scale = targetHeight / unscaledViewport.height;
    const viewport = page.getViewport({ scale });

    if (i === 1) {
      firstPageWidth = viewport.width;
      firstPageHeight = viewport.height;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) continue;

    // Fill white background for pages that don't have explicit background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    // Render page
    await page.render(renderContext).promise;

    // Convert to JPEG data URL with high quality
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    pageImages.push(dataUrl);
  }

  return {
    pages: pageImages,
    pageCount: numPages,
    width: firstPageWidth,
    height: firstPageHeight,
    aspectRatio: firstPageWidth / firstPageHeight,
  };
}
