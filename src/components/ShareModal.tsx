import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import { BookSettings } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BookSettings;
  onSwitchToClientMode: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSwitchToClientMode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const params = new URLSearchParams({
    view: 'client',
    format: settings.format,
    pages: String(settings.pageCount),
    weight: String(settings.paperWeight),
    finish: settings.paperFinish,
    angle: String(Math.round(settings.openAngle)),
    spread: String(settings.currentSpread),
  });
  const clientUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(clientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="bg-dark-900 border border-dark-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black">
        {/* Modal Header */}
        <div className="p-5 border-b border-dark-700/60 flex items-center justify-between bg-dark-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center border border-gold-400/20">
              <ShareIcon className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-dark-50">
                Partager la Maquette au Client
              </h3>
              <p className="text-xs text-dark-400">
                Générez une vue de présentation épurée sans interface d'édition
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
        <div className="p-6 space-y-5">
          {/* Link Box */}
          <div>
            <label className="text-xs font-bold text-dark-300 block mb-2">
              Lien direct pour votre client :
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={clientUrl}
                className="flex-1 bg-dark-950 border border-dark-700 rounded-xl px-3.5 py-2 text-xs font-mono text-dark-200 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gold-400 hover:bg-gold-300 text-dark-950'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Features in client view */}
          <div className="p-4 rounded-xl bg-dark-850/80 border border-dark-700/60 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark-400 block mb-1">
              Ce que votre client verra :
            </span>

            <div className="flex items-start gap-2.5 text-xs text-dark-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-dark-100">Visualisation 3D immersive</strong> : rotation 360°, zoom, feuilletage des pages.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-dark-300">
              <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-dark-100">Fiche technique d'impression</strong> : Format {settings.format.toUpperCase()}, Papier {settings.paperWeight}g/m², finition {settings.paperFinish}.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-dark-300">
              <Eye className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-dark-100">Zéro distraction</strong> : les panneaux d'import, téléversement et suppression sont entièrement masqués.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-dark-700/60 bg-dark-900 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onSwitchToClientMode();
            }}
            className="flex items-center gap-2 text-xs font-bold text-gold-400 hover:text-gold-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Tester la vue Client maintenant</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-dark-200 transition-all border border-dark-700/60"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
