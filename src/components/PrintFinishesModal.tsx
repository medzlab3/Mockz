import React, { useState } from 'react';
import { X, Sparkles, Check, Info, BookOpen, Layers } from 'lucide-react';
import { BookSettings, PaperFinish, PaperWeight } from '../types';

interface PrintFinishesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BookSettings;
  onUpdateSettings: (newSettings: Partial<BookSettings>) => void;
}

export const PrintFinishesModal: React.FC<PrintFinishesModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'inside'>('cover');

  if (!isOpen) return null;

  const currentCoverWeight = settings.coverPaperWeight || settings.paperWeight || 350;
  const currentCoverFinish = settings.coverPaperFinish || settings.paperFinish || 'matte';
  const currentInsideWeight = settings.insidePaperWeight || settings.paperWeight || 120;
  const currentInsideFinish = settings.insidePaperFinish || settings.paperFinish || 'matte';

  const isFourPages = settings.pageCount <= 4;

  const finishes: { id: PaperFinish; name: string; desc: string; visual: string }[] = [
    {
      id: 'matte',
      name: 'Couché Mat',
      desc: 'Toucher doux et soyeux, absence totale de reflets gênants. Idéal pour faire-part, menus et art.',
      visual: 'bg-dark-750 border-dark-600',
    },
    {
      id: 'glossy',
      name: 'Couché Brillant',
      desc: 'Reflets lumineux vifs sous l’éclairage studio. Fait ressortir l’éclat des couleurs et des photos.',
      visual: 'bg-gradient-to-tr from-dark-700 via-dark-600 to-gold-400/30 border-dark-500',
    },
    {
      id: 'kraft',
      name: 'Papier Kraft Naturel',
      desc: 'Teinte brune chaleureuse et aspect brut écologique. Idéal pour invitations champêtres.',
      visual: 'bg-[#5c4326] border-[#7d5c36]',
    },
    {
      id: 'textured',
      name: 'Papier Vergé / Canson',
      desc: 'Micro-relief de fibres authentiques avec diffusion de lumière feutrée.',
      visual: 'bg-dark-700 border-dark-600',
    },
  ];

  const weights: { weight: PaperWeight; label: string; desc: string; thickness: string }[] = [
    {
      weight: 120,
      label: '120g / m²',
      desc: 'Feuille souple (style magazine ou pages intérieures). Onde gracieusement au feuilletage.',
      thickness: 'Très fin & flexible',
    },
    {
      weight: 250,
      label: '250g / m²',
      desc: 'Grammage standard cartonné pour cartes de vœux, cartons d’invitation et couvertures souples.',
      thickness: 'Semi-rigide',
    },
    {
      weight: 350,
      label: '350g / m²',
      desc: 'Carton épais de prestige. Maintien parfait, tranche nette et rigide de haute tenue.',
      thickness: 'Rigide haute tenue',
    },
  ];

  const handleUpdateCover = (patch: { coverPaperWeight?: PaperWeight; coverPaperFinish?: PaperFinish }) => {
    onUpdateSettings({
      ...patch,
      // Keep legacy fields in sync for cover
      ...(patch.coverPaperWeight ? { paperWeight: patch.coverPaperWeight } : {}),
      ...(patch.coverPaperFinish ? { paperFinish: patch.coverPaperFinish } : {}),
    });
  };

  const handleUpdateInside = (patch: { insidePaperWeight?: PaperWeight; insidePaperFinish?: PaperFinish }) => {
    onUpdateSettings(patch);
  };

  const finishShort = (finish: PaperFinish) => {
    switch (finish) {
      case 'matte': return 'Couché Mat';
      case 'glossy': return 'Couché Brillant';
      case 'kraft': return 'Kraft Naturel';
      case 'textured': return 'Papier Vergé';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="bg-dark-900 border border-dark-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-dark-700/60 flex items-center justify-between bg-dark-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center border border-gold-400/20">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-dark-50">
                Papiers &amp; Finitions d'Impression
              </h3>
              <p className="text-xs text-dark-400">
                Personnalisez séparément le papier de la couverture et des pages intérieures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Couverture vs Pages Intérieures */}
        <div className="px-5 pt-3 border-b border-dark-750 bg-dark-850/50 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'cover'
                ? 'border-gold-400 text-gold-400'
                : 'border-transparent text-dark-400 hover:text-dark-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Papier de Couverture (4 pages)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700 font-mono">
              {currentCoverWeight}g • {finishShort(currentCoverFinish)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inside')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'inside'
                ? 'border-gold-400 text-gold-400'
                : 'border-transparent text-dark-400 hover:text-dark-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Feuillets Intérieurs</span>
            {!isFourPages && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700 font-mono">
                {currentInsideWeight}g • {finishShort(currentInsideFinish)}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'cover' ? (
            /* TAB 1: COUVERTURE */
            <div className="space-y-6">
              {/* Info banner */}
              <div className="p-3.5 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-dark-200 leading-relaxed">
                  <strong className="text-gold-400 font-semibold">Papier de couverture :</strong>{' '}
                  S'applique sur les 4 pages de couverture (1ère de couv, 2ème de couv, 3ème de couv et dos). Un grammage rigide de 250g ou 350g est recommandé pour une excellente tenue.
                </p>
              </div>

              {/* Cover Weight */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-dark-300">
                    1. Grammage de la Couverture
                  </label>
                  <span className="text-xs text-gold-400 font-mono font-bold">
                    {currentCoverWeight} g/m² sélectionné
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {weights.map((w) => {
                    const isSelected = currentCoverWeight === w.weight;
                    return (
                      <button
                        key={`cover-${w.weight}`}
                        onClick={() => handleUpdateCover({ coverPaperWeight: w.weight })}
                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-gold-400 bg-gold-400/10 ring-1 ring-gold-400 shadow-sm'
                            : 'border-dark-700/60 bg-dark-850/60 hover:border-dark-600 hover:bg-dark-800'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 text-gold-400">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-bold text-sm text-dark-100 block">
                          {w.label}
                        </span>
                        <span className="text-[11px] text-gold-400 font-semibold block mt-0.5">
                          {w.thickness}
                        </span>
                        <p className="text-[11px] text-dark-400 mt-1.5 leading-relaxed">
                          {w.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover Finish */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-dark-300">
                    2. Finition de la Couverture
                  </label>
                  <span className="text-xs text-gold-400 font-bold">
                    {finishShort(currentCoverFinish)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {finishes.map((f) => {
                    const isSelected = currentCoverFinish === f.id;
                    return (
                      <button
                        key={`cover-${f.id}`}
                        onClick={() => handleUpdateCover({ coverPaperFinish: f.id })}
                        className={`p-4 rounded-xl border text-left transition-all relative flex items-start gap-3 ${
                          isSelected
                            ? 'border-gold-400 bg-gold-400/10 ring-1 ring-gold-400 shadow-sm'
                            : 'border-dark-700/60 bg-dark-850/60 hover:border-dark-600 hover:bg-dark-800'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg border flex-shrink-0 mt-0.5 ${f.visual}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-dark-100">
                              {f.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-gold-400" />}
                          </div>
                          <p className="text-[11px] text-dark-400 mt-1 leading-relaxed">
                            {f.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: PAGES INTÉRIEURES */
            <div className="space-y-6">
              {isFourPages ? (
                <div className="p-6 rounded-2xl bg-dark-850/70 border border-dark-700 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center mx-auto border border-gold-400/20">
                    <BookOpen className="w-5 h-5 text-gold-400" />
                  </div>
                  <h4 className="text-sm font-bold text-dark-100">
                    Support 4 pages (1 feuille unique pliée)
                  </h4>
                  <p className="text-xs text-dark-300 max-w-md mx-auto leading-relaxed">
                    Votre projet compte actuellement 4 volets. Dans les règles de l'art d'imprimerie, un 4 pages est imprimé sur une seule et même feuille recto/verso pliée en deux. L'intérieur utilise donc automatiquement le papier de couverture ({currentCoverWeight}g • {finishShort(currentCoverFinish)}).
                  </p>
                  <p className="text-[11px] text-dark-400">
                    Pour configurer un papier intérieur indépendant, augmentez le nombre de volets à 8 pages ou plus (+4).
                  </p>
                </div>
              ) : (
                <>
                  {/* Info banner */}
                  <div className="p-3.5 rounded-xl bg-dark-800/80 border border-dark-700 flex items-start gap-2.5">
                    <Layers className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-dark-200 leading-relaxed">
                      <strong className="text-gold-400 font-semibold">Cahier intérieur ({settings.pageCount - 4} pages) :</strong>{' '}
                      S'applique sur l'ensemble des feuillets intérieurs du livret. Un papier plus souple (120g couché mat) facilite l'ouverture et le feuilletage réaliste.
                    </p>
                  </div>

                  {/* Inside Weight */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-dark-300">
                        1. Grammage des Pages Intérieures
                      </label>
                      <span className="text-xs text-gold-400 font-mono font-bold">
                        {currentInsideWeight} g/m² sélectionné
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {weights.map((w) => {
                        const isSelected = currentInsideWeight === w.weight;
                        return (
                          <button
                            key={`inside-${w.weight}`}
                            onClick={() => handleUpdateInside({ insidePaperWeight: w.weight })}
                            className={`p-3.5 rounded-xl border text-left transition-all relative ${
                              isSelected
                                ? 'border-gold-400 bg-gold-400/10 ring-1 ring-gold-400 shadow-sm'
                                : 'border-dark-700/60 bg-dark-850/60 hover:border-dark-600 hover:bg-dark-800'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 text-gold-400">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                            <span className="font-bold text-sm text-dark-100 block">
                              {w.label}
                            </span>
                            <span className="text-[11px] text-gold-400 font-semibold block mt-0.5">
                              {w.thickness}
                            </span>
                            <p className="text-[11px] text-dark-400 mt-1.5 leading-relaxed">
                              {w.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inside Finish */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-dark-300">
                        2. Finition des Pages Intérieures
                      </label>
                      <span className="text-xs text-gold-400 font-bold">
                        {finishShort(currentInsideFinish)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {finishes.map((f) => {
                        const isSelected = currentInsideFinish === f.id;
                        return (
                          <button
                            key={`inside-${f.id}`}
                            onClick={() => handleUpdateInside({ insidePaperFinish: f.id })}
                            className={`p-4 rounded-xl border text-left transition-all relative flex items-start gap-3 ${
                              isSelected
                                ? 'border-gold-400 bg-gold-400/10 ring-1 ring-gold-400 shadow-sm'
                                : 'border-dark-700/60 bg-dark-850/60 hover:border-dark-600 hover:bg-dark-800'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg border flex-shrink-0 mt-0.5 ${f.visual}`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-dark-100">
                                  {f.name}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-gold-400" />}
                              </div>
                              <p className="text-[11px] text-dark-400 mt-1 leading-relaxed">
                                {f.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Upcoming V2 Preview */}
          <div className="p-4 rounded-xl bg-dark-850/80 border border-dark-700/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-dark-100">
                Finitions d'exception en cours d'intégration (V2)
              </h4>
              <p className="text-[11px] text-dark-400 mt-1 leading-relaxed">
                Les modules de <strong className="text-dark-200">Dorure à chaud (Or / Argent)</strong> et de <strong className="text-dark-200">Vernis sélectif UV</strong> permettront prochainement d’importer un masque noir &amp; blanc pour faire briller sélectivement vos titres.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-dark-700/60 bg-dark-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gold-400 hover:bg-gold-300 text-dark-950 transition-all shadow-md shadow-gold-500/20 active:scale-95"
          >
            Appliquer &amp; Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
