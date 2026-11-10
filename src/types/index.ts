export type PageFormat = 'a5' | 'a4' | 'square' | 'landscape';

export type PaperFinish = 'matte' | 'glossy' | 'kraft' | 'textured';

export type PaperWeight = 120 | 250 | 350;

export interface PageSlot {
  index: number;
  label: string;
  sublabel: string;
  imageUrl: string | null;
  side: 'cover-front' | 'inside-left' | 'inside-right' | 'cover-back' | 'page-left' | 'page-right';
}

export interface BookSettings {
  format: PageFormat;
  pageCount: number; // min 4, must be multiple of 2 (or 4 for signature)
  openAngle: number; // 0 (closed) to 180 (flat open)
  currentSpread: number; // 0 = closed cover (P1), 1 = P2-3, 2 = P4-5, ... S = closed back (PN)
  paperFinish: PaperFinish;
  paperWeight: PaperWeight;
  autoRotate: boolean;
  roughness: number;
  metalness: number;
  showShadows: boolean;
  backgroundTheme: 'dark' | 'light' | 'studio' | 'transparent';
}

export interface ClientComment {
  id: string;
  pageIndex: number | 'all'; // 1-based page index or 'all' for global
  author: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
}

export interface BATApproval {
  approved: boolean;
  approvedAt: string;
  clientName: string;
  clientEmail?: string;
  company?: string;
  format: PageFormat;
  paperWeight: PaperWeight;
  paperFinish: PaperFinish;
  pageCount: number;
  notes?: string;
  batReference?: string;
}

export const FORMAT_DIMENSIONS: Record<PageFormat, { width: number; height: number; ratio: string; label: string }> = {
  a5: { width: 3.0, height: 4.24, ratio: '1 : 1.41', label: 'A5 Portrait (148 × 210 mm)' },
  a4: { width: 3.2, height: 4.52, ratio: '1 : 1.41', label: 'A4 Portrait (210 × 297 mm)' },
  square: { width: 3.5, height: 3.5, ratio: '1 : 1', label: 'Carré (150 × 150 mm)' },
  landscape: { width: 4.5, height: 3.18, ratio: '1.41 : 1', label: 'A5 Paysage (210 × 148 mm)' },
};
