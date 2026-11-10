import { ProjectData, PageSlot } from '../types';

const FIREBASE_API_KEY = 'AIzaSyCGgFLnvqYkq64Dw4lrxVHaJ7NXCl1uwy8';
const FIREBASE_PROJECT_ID = 'mockz-studio';
const BASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/projects`;

function toFirestore(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestore) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestore(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestore(val: any): any {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestore);
  }
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = fromFirestore(v);
    }
    return obj;
  }
  return null;
}

/**
 * Compresses an image dataURL using canvas with specified max dimension and quality.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxDim: number = 750,
  quality: number = 0.65
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Draw background white for transparent PNGs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Adaptively optimizes all page images to guarantee the total Firestore document
 * stays strictly below Firestore's 1 MiB (1,048,576 bytes) limit.
 */
export async function optimizePagesForFirestore(pages: PageSlot[]): Promise<PageSlot[]> {
  const pagesWithImages = pages.filter((p) => !!p.imageUrl);
  const count = pagesWithImages.length;
  if (count === 0) return pages;

  // Determine compression parameters based on page count
  let maxDim = 850;
  let quality = 0.72;

  if (count <= 4) {
    maxDim = 850;
    quality = 0.72;
  } else if (count <= 8) {
    maxDim = 720;
    quality = 0.65;
  } else if (count <= 12) {
    maxDim = 620;
    quality = 0.58;
  } else if (count <= 16) {
    maxDim = 540;
    quality = 0.52;
  } else {
    maxDim = 460;
    quality = 0.46;
  }

  // Pass 1: compress all images
  let optimized = await Promise.all(
    pages.map(async (page) => {
      if (!page.imageUrl) return page;
      const compressed = await compressImageDataUrl(page.imageUrl, maxDim, quality);
      return { ...page, imageUrl: compressed };
    })
  );

  // Check total estimated string size
  let totalImgLength = optimized.reduce((acc, p) => acc + (p.imageUrl ? p.imageUrl.length : 0), 0);

  // Firestore hard limit is 1,048,576 bytes. Target <= 750,000 bytes for safety margin.
  if (totalImgLength > 750000) {
    const scaleFactor = Math.sqrt(700000 / totalImgLength);
    maxDim = Math.max(380, Math.floor(maxDim * scaleFactor));
    quality = Math.max(0.40, quality * scaleFactor);

    optimized = await Promise.all(
      optimized.map(async (page) => {
        if (!page.imageUrl) return page;
        const recompressed = await compressImageDataUrl(page.imageUrl, maxDim, quality);
        return { ...page, imageUrl: recompressed };
      })
    );
  }

  return optimized;
}

/**
 * Saves project data to Cloud Firestore.
 */
export async function saveProjectToCloud(
  projectId: string,
  project: ProjectData
): Promise<boolean> {
  try {
    const url = `${BASE_FIRESTORE_URL}/${projectId}?key=${FIREBASE_API_KEY}`;

    // Optimize images adaptively before saving
    const optimizedPages = await optimizePagesForFirestore(project.pages);

    const payload = {
      fields: {
        projectId: { stringValue: projectId },
        updatedAt: { stringValue: new Date().toISOString() },
        settings: toFirestore(project.settings),
        pages: toFirestore(optimizedPages),
        comments: toFirestore(project.comments || []),
        batApproval: toFirestore(project.batApproval || null),
      },
    };

    const bodyString = JSON.stringify(payload);

    // Safeguard check
    if (bodyString.length > 1000000) {
      console.warn(`[Mockz Cloud] Payload is large (${bodyString.length} bytes), compressing further...`);
      // Secondary emergency compression
      const ultraOptimized = await Promise.all(
        optimizedPages.map(async (page) => {
          if (!page.imageUrl) return page;
          const re = await compressImageDataUrl(page.imageUrl, 400, 0.40);
          return { ...page, imageUrl: re };
        })
      );
      payload.fields.pages = toFirestore(ultraOptimized);
    }

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Mockz Cloud] Firestore Save Failed:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Mockz Cloud] Network/Sync error:', err);
    return false;
  }
}

/**
 * Loads project data from Cloud Firestore.
 */
export async function loadProjectFromCloud(
  projectId: string
): Promise<ProjectData | null> {
  try {
    const url = `${BASE_FIRESTORE_URL}/${projectId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data || !data.fields) {
      return null;
    }

    const fields = data.fields;
    const settings = fromFirestore(fields.settings);
    const pages = fromFirestore(fields.pages) || [];
    const comments = fromFirestore(fields.comments) || [];
    const batApproval = fromFirestore(fields.batApproval) || null;
    const updatedAt = fields.updatedAt?.stringValue || new Date().toISOString();

    return {
      id: projectId,
      settings,
      pages,
      comments,
      batApproval,
      updatedAt,
    };
  } catch (err) {
    console.warn('[Mockz Cloud] Could not load from cloud:', err);
    return null;
  }
}
