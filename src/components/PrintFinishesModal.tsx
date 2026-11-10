import React from 'react';
import { X, Sparkles, Check, Info } from 'lucide-react';
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
  if (!isOpen) return null;

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
      desc: 'Feuille souple (style magazine ou pages intérieures de livret). Onde gracieusement.',
      thickness: 'Très fin & flexible',
    },
    {
      weight: 250,
      label: '250g / m²',
      desc: 'Grammage standard cartonné pour cartes de vœux, cartons d’invitation et couvertures.',
      thickness: 'Semi-rigide',
    },
    {
      weight: 350,
      label: '350g / m²',
      desc: 'Carton épais de prestige. Maintien parfait, tranche nette et rigide.',
      thickness: 'Rigide haute tenue',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="bg-dark-900 border border-dark-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black">
        {/* Modal Header */}
        <div className="p-5 border-b border-dark-700/60 flex items-center justify-between bg-dark-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center border border-gold-400/20">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-dark-50">
                Simulation des Papiers &amp; Finitions d'Impression
              </h3>
              <p className="text-xs text-dark-400">
                Ajustez le grammage physique et le traitement de surface du mockup 3D
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Grammage (Poids du papier) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-dark-300">
                1. Épaisseur &amp; Grammage du Papier
              </label>
              <span className="text-xs text-gold-400 font-mono font-bold">
                {settings.paperWeight} g/m² sélectionné
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {weights.map((w) => {
                const isSelected = settings.paperWeight === w.weight;
                return (
                  <button
                    key={w.weight}
                    onClick={() => onUpdateSettings({ paperWeight: w.weight })}
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

          {/* Section 2: Type de papier & Pelliculage */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-dark-300">
                2. Finition de Surface &amp; Texture
              </label>
              <span className="text-xs text-gold-400 font-bold capitalize">
                {settings.paperFinish}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {finishes.map((f) => {
                const isSelected = settings.paperFinish === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onUpdateSettings({ paperFinish: f.id })}
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

          {/* Upcoming V2 Preview Feature */}
          <div className="p-4 rounded-xl bg-dark-850/80 border border-dark-700/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-dark-100">
                Finitions d'exception en cours d'intégration (V2)
              </h4>
              <p className="text-[11px] text-dark-400 mt-1 leading-relaxed">
                Les modules de <strong className="text-dark-200">Dorure à chaud (Or / Argent métallique)</strong> et de <strong className="text-dark-200">Vernis sélectif UV</strong> permettront prochainement d’importer un masque de finition noir &amp; blanc pour faire briller uniquement les titres ou dorures de vos créations.
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
