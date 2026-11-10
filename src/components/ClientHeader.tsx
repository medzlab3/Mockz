import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Maximize,
  Minimize,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { BookSettings, FORMAT_DIMENSIONS, BATApproval } from '../types';

interface ClientHeaderProps {
  settings: BookSettings;
  commentsCount: number;
  batApproval: BATApproval | null;
  onOpenFinishesModal: () => void;
  onOpenCommentsModal: () => void;
  onOpenBATModal: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  settings,
  commentsCount,
  batApproval,
  onOpenFinishesModal,
  onOpenCommentsModal,
  onOpenBATModal,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const finishShort =
    settings.paperFinish === 'matte'
      ? 'Couché Mat'
      : settings.paperFinish === 'glossy'
      ? 'Couché Brillant'
      : settings.paperFinish === 'kraft'
      ? 'Kraft Naturel'
      : 'Papier Vergé';

  return (
    <header className="h-14 sm:h-16 border-b border-dark-700/60 bg-dark-900/95 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-20 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-gold-500 to-gold-400 flex items-center justify-center shadow-lg shadow-gold-500/20 text-dark-950 font-black">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-dark-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-tight text-dark-50">Mockz</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              Aperçu Client • BAT
            </span>
          </div>
          <p className="text-[11px] text-dark-400 hidden md:block">
            Présentation interactive 3D &amp; validation avant impression
          </p>
        </div>
      </div>

      {/* Center Print Specs for the Client (Desktop) */}
      <div className="hidden xl:flex items-center gap-2 bg-dark-800/90 px-3.5 py-1.5 rounded-xl border border-dark-700/60 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-gold-400" />
        <span className="text-xs text-dark-300 font-medium">Spécifications :</span>
        <span className="text-xs font-bold text-dark-100">
          {(FORMAT_DIMENSIONS[settings.format] || FORMAT_DIMENSIONS.a5).label.split('(')[0].trim()}
        </span>
        <span className="text-dark-600">•</span>
        <span className="text-xs font-bold text-gold-400 font-mono">
          {settings.paperWeight} g/m²
        </span>
        <span className="text-dark-600">•</span>
        <span className="text-xs font-semibold text-dark-200">
          {finishShort}
        </span>
        <span className="text-dark-600">•</span>
        <span className="text-xs font-mono text-dark-300">
          {settings.pageCount} volets
        </span>
      </div>

      {/* Right Actions: Paper finishes, Comments, BAT Validation, Fullscreen */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Choix Papier & Finitions pour le client */}
        <button
          onClick={onOpenFinishesModal}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-gold-400 border border-gold-400/30 transition-all shadow-sm active:scale-95"
          title="Tester les finitions et choisir le papier"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span className="hidden sm:inline">Papiers &amp; Finitions</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-400/15 text-gold-400 font-mono hidden md:inline">
            {settings.paperWeight}g • {finishShort}
          </span>
        </button>

        {/* Commentaires / Retours */}
        <button
          onClick={onOpenCommentsModal}
          className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-dark-200 hover:text-gold-400 border border-dark-750 hover:border-gold-400/40 transition-all shadow-sm active:scale-95"
          title="Laisser un commentaire ou une remarque"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Commentaires</span>
          {commentsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-gold-400 text-dark-950 font-mono text-[9px] font-bold flex items-center justify-center">
              {commentsCount}
            </span>
          )}
        </button>

        {/* Validation BAT */}
        <button
          onClick={onOpenBATModal}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            batApproval?.approved
              ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50'
              : 'bg-emerald-500 hover:bg-emerald-400 text-dark-950 shadow-emerald-500/20'
          }`}
          title="Valider le Bon À Tirer (BAT)"
        >
          {batApproval?.approved ? (
            <FileCheck className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{batApproval?.approved ? 'BAT Validé ✓' : 'Valider le BAT'}</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl text-dark-400 hover:text-dark-100 bg-dark-800 hover:bg-dark-750 transition-colors border border-dark-700/60"
          title="Plein écran"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
