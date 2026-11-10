import * as THREE from 'three';
import { PageSlot, PaperFinish } from '../types';

// Cache for generated default textures; cleared on every full rebuild
const textureCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

/**
 * Disposes and clears ALL cached textures.
 * MUST be called before any full rebuild so stale textures from a previous
 * document are never reused.
 */
export function clearTextureCache() {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}

/**
 * Generates an elegant placeholder texture for empty pages
 */
export function createDefaultPageTexture(
  page: PageSlot,
  finish: PaperFinish = 'matte'
): THREE.Texture {
  const cacheKey = `default_${page.index}_${page.label}_${finish}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1448; // A-ratio proportion
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.Texture();
  }

  // Base paper color based on finish
  let baseColor = '#fcfbf9';
  let accentColor = '#eae0bf';
  let textColor = '#786d52';

  if (finish === 'kraft') {
    baseColor = '#d2b48c';
    accentColor = '#b8976b';
    textColor = '#5c4033';
  }

  // Fill background
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper grain noise
  addPaperNoise(ctx, canvas.width, canvas.height, finish === 'kraft' ? 0.08 : 0.025);

  // Elegant dashed inner border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 12]);
  ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
  ctx.setLineDash([]);

  // Corner crop marks
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  const markSize = 30;
  ctx.beginPath(); ctx.moveTo(40, 60); ctx.lineTo(40 + markSize, 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(60, 40); ctx.lineTo(60, 40 + markSize); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(canvas.width - 40, 60); ctx.lineTo(canvas.width - 40 - markSize, 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(canvas.width - 60, 40); ctx.lineTo(canvas.width - 60, 40 + markSize); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, canvas.height - 60); ctx.lineTo(40 + markSize, canvas.height - 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(60, canvas.height - 40); ctx.lineTo(60, canvas.height - 40 - markSize); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(canvas.width - 40, canvas.height - 60); ctx.lineTo(canvas.width - 40 - markSize, canvas.height - 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(canvas.width - 60, canvas.height - 40); ctx.lineTo(canvas.width - 60, canvas.height - 40 - markSize); ctx.stroke();

  // Page Badge Center
  const centerY = canvas.height * 0.42;

  ctx.fillStyle = finish === 'kraft' ? '#be9b7b' : '#f5f0df';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 90, centerY - 90, 180, 180, 32);
  ctx.fill();

  ctx.fillStyle = '#b38600';
  ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`P.${page.index}`, canvas.width / 2, centerY);

  ctx.font = '600 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = finish === 'kraft' ? '#4a3525' : '#262217';
  ctx.fillText(page.label.toUpperCase(), canvas.width / 2, centerY + 140);

  ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = textColor;
  ctx.fillText(page.sublabel, canvas.width / 2, centerY + 185);

  ctx.font = 'italic 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#a39675';
  ctx.fillText('Glissez un visuel ou importez un PDF', canvas.width / 2, centerY + 240);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Loads a texture from an Image Data URL or Object URL
 */
export function loadUserTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 16;
        resolve(texture);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

/**
 * Adds subtle procedural noise to simulate paper texture
 */
function addPaperNoise(ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * opacity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imgData, 0, 0);
}
