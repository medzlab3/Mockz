import React, { useState, useRef } from 'react';
import {
  FileUp,
  Image as ImageIcon,
  Trash2,
  Layers,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  X
} from 'lucide-react';
import { PageSlot, BookSettings } from '../types';
import { convertPdfToImages } from '../utils/pdfProcessor';

interface SidebarProps {
  settings: BookSettings;
  pages: PageSlot[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<BookSettings>) => void;
  onUpdatePageImage: (pageIndex: number, imageUrl: string | null) => void;
  onApplyPdfPages: (images: string[]) => void;
  onLoadSampleDesign: () => void;
  onResetProject: () => void;
  onPageCountChange: (count: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  pages,
  isOpen,
  onClose,
  onUpdatePageImage,
  onApplyPdfPages,
  onLoadSampleDesign,
  onResetProject,
  onPageCountChange,
}) => {
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [conversionProgress, setConversionProgress] = useState({ current: 0, total: 0 });
  const [dragOverGlobal, setDragOverGlobal] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Veuillez sélectionner un fichier au format .PDF');
      return;
    }

    try {
      setIsConvertingPdf(true);
      setConversionProgress({ current: 0, total: 1 });

      const result = await convertPdfToImages(file, (current, total) => {
        setConversionProgress({ current, total });
      });

      onApplyPdfPages(result.pages);
    } catch (err) {
      console.error('Erreur lors de la conversion du PDF:', err);
      alert('Impossible de lire ce fichier PDF. Vérifiez qu\'il n\'est pas corrompu ou protégé par mot de passe.');
    } finally {
      setIsConvertingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handleSingleImageUpload = (pageIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onUpdatePageImage(pageIndex, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 sidebar-backdrop lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-80 sm:w-96
          lg:relative lg:inset-auto lg:z-10
          border-r border-dark-700/60 bg-dark-900/98 backdrop-blur-2xl
          flex flex-col h-full select-none
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-dark-700/60 bg-dark-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold-400" />
              <h2 className="font-bold text-sm text-dark-50">Pages &amp; Designs</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-dark-800 text-gold-400 border border-dark-700/60 font-mono font-medium">
                {pages.length} pages
              </span>
              <button
                onClick={() => {
                  if (confirm('Réinitialiser le projet ? Toutes les pages seront vidées.')) {
                    onResetProject();
                  }
                }}
                className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Nouveau projet (tout réinitialiser)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {/* Close button on mobile */}
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverGlobal(true);
            }}
            onDragLeave={() => setDragOverGlobal(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverGlobal(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePdfUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => pdfInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
              dragOverGlobal
                ? 'border-gold-400 bg-gold-400/10'
                : 'border-dark-600/70 hover:border-gold-400/60 bg-dark-850/60 hover:bg-dark-800/80'
            }`}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePdfUpload(e.target.files[0]);
                }
              }}
            />

            {isConvertingPdf ? (
              <div className="py-2 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-semibold text-dark-100">
                  Conversion du PDF en 2K...
                </div>
                <div className="text-[11px] text-dark-400">
                  Page {conversionProgress.current} sur {conversionProgress.total}
                </div>
                <div className="w-full bg-dark-750 h-1 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-gold-400 h-full transition-all duration-200"
                    style={{
                      width: `${
                        conversionProgress.total > 0
                          ? (conversionProgress.current / conversionProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <div className="w-8 h-8 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center">
                  <FileUp className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-dark-100">
                  Importer un fichier PDF
                </p>
                <p className="text-[11px] text-dark-400">
                  Glissez votre PDF ou cliquez pour parcourir
                </p>
              </div>
            )}
          </div>

          {/* Quick Demo Sample Action */}
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[11px] text-dark-400">Pas de PDF sous la main ?</span>
            <button
              onClick={onLoadSampleDesign}
              className="text-[11px] font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-gold-400" />
              <span>Charger un exemple</span>
            </button>
          </div>
        </div>

        {/* Page Count Configuration */}
        <div className="px-4 py-2.5 border-b border-dark-700/60 bg-dark-850/50 flex items-center justify-between">
          <span className="text-xs text-dark-300 font-medium">Nombre de volets :</span>
          <div className="flex items-center gap-1 bg-dark-800/90 p-0.5 rounded-lg border border-dark-700/60">
            {[4, 8, 12, 16].map((count) => (
              <button
                key={count}
                onClick={() => onPageCountChange(count)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                  settings.pageCount === count
                    ? 'bg-gold-400 text-dark-950 shadow-sm'
                    : 'text-dark-400 hover:text-dark-100'
                }`}
              >
                {count}p
              </button>
            ))}
          </div>
        </div>

        {/* Pages List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
          {pages.map((page, idx) => {
            const hasImage = !!page.imageUrl;
            return (
              <div
                key={`page-${page.index}-${idx}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleSingleImageUpload(idx, e.dataTransfer.files[0]);
                  }
                }}
                className={`p-3 rounded-xl border transition-all ${
                  hasImage
                    ? 'border-dark-700/80 bg-dark-800/80 hover:border-gold-400/40'
                    : 'border-dark-750/60 bg-dark-850/40 hover:border-dark-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-dark-750 text-gold-400 font-mono text-[10px] font-bold flex items-center justify-center border border-dark-600/50">
                      {page.index}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-dark-100">
                        {page.label}
                      </h4>
                      <span className="text-[10px] text-dark-400 block leading-tight">
                        {page.sublabel}
                      </span>
                    </div>
                  </div>

                  {hasImage ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Chargé
                    </span>
                  ) : (
                    <span className="text-[10px] text-dark-400 px-2 py-0.5 rounded-full bg-dark-750 border border-dark-700/50">
                      Vierge
                    </span>
                  )}
                </div>

                {/* Page Thumbnail & Slot Action */}
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => pageInputRefs.current[idx]?.click()}
                    className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden border border-dark-700 bg-dark-950 flex-shrink-0 cursor-pointer group flex items-center justify-center shadow-inner"
                  >
                    {hasImage ? (
                      <img
                        src={page.imageUrl!}
                        alt={`Page ${page.index}`}
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-dark-500 group-hover:text-dark-300 transition-colors">
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-[9px] mt-1 font-mono">P.{page.index}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-dark-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-gold-400 text-[10px] font-bold">
                      Modifier
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-1.5">
                    <input
                      ref={(el) => (pageInputRefs.current[idx] = el)}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSingleImageUpload(idx, e.target.files[0]);
                        }
                      }}
                    />

                    <button
                      onClick={() => pageInputRefs.current[idx]?.click()}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-dark-750 hover:bg-dark-700 text-dark-200 hover:text-dark-50 rounded-lg border border-dark-600/50 flex items-center justify-center gap-1.5 transition-all w-full"
                    >
                      <FileUp className="w-3.5 h-3.5 text-dark-400" />
                      <span>Remplacer visuel</span>
                    </button>

                    {hasImage && (
                      <button
                        onClick={() => onUpdatePageImage(idx, null)}
                        className="px-2 py-1 text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center justify-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Réinitialiser</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Signature Footer */}
        <div className="px-4 py-3 border-t border-dark-700/60 bg-dark-950 flex items-center justify-between">
          <span className="text-[10px] text-dark-400 font-mono font-medium">v0.1.0</span>
          <span className="text-[11px] text-dark-400">
            Proudly made by{' '}
            <a
              href="https://medz.design"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 hover:text-gold-300 font-bold underline decoration-gold-400/40 hover:decoration-gold-400 transition-colors"
            >
              Medz
            </a>
          </span>
        </div>
      </aside>
    </>
  );
};
