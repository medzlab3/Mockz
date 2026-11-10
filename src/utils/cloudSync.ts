import { ProjectData } from '../types';

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
 * Compresses an image dataURL if necessary so projects sync seamlessly.
 */
export async function compressImageForSync(
  dataUrl: string,
  maxDim: number = 1000,
  quality: number = 0.8
): Promise<string> {
  // If not data URL or already small enough, keep as is
  if (!dataUrl.startsWith('data:image/') || dataUrl.length < 80000) {
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
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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

    // Optimize images before saving
    const optimizedPages = await Promise.all(
      project.pages.map(async (page) => {
        if (!page.imageUrl) return page;
        const compressed = await compressImageForSync(page.imageUrl);
        return { ...page, imageUrl: compressed };
      })
    );

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

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.warn('Could not save to cloud:', err);
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
    console.warn('Could not load from cloud:', err);
    return null;
  }
}
