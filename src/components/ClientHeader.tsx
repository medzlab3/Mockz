import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, Maximize, Minimize, Edit3 } from 'lucide-react';
import { BookSettings, FORMAT_DIMENSIONS } from '../types';

interface ClientHeaderProps {
  settings: BookSettings;
  onExitClientMode: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  settings,
  onExitClientMode,
}) => {
  const [isApproved, setIsApproved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-dark-700/60 bg-dark-900/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-20 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-gold-500 to-gold-400 flex items-center justify-center shadow-lg shadow-gold-500/20 text-dark-950 font-black">
          <BookOpen className="w-5 h-5 text-dark-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-tight text-dark-50">Mockz</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              Aperçu Client • Bon à Tirer
            </span>
          </div>
          <p className="text-[11px] text-dark-400 hidden sm:block">Présentation interactive de votre support imprimé</p>
        </div>
      </div>

      {/* Center Print Specs for the Client (Desktop) */}
      <div className="hidden lg:flex items-center gap-2 bg-dark-800/90 px-3.5 py-1.5 rounded-xl border border-dark-700/60 shadow-inner">
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
        <span className="text-xs font-semibold text-dark-200 capitalize">
          {settings.paperFinish === 'matte' && 'Couché Mat'}
          {settings.paperFinish === 'glossy' && 'Couché Brillant'}
          {settings.paperFinish === 'kraft' && 'Kraft Naturel'}
          {settings.paperFinish === 'textured' && 'Papier Vergé'}
        </span>
        <span className="text-dark-600">•</span>
        <span className="text-xs font-mono text-dark-300">
          {settings.pageCount} volets
        </span>
      </div>

      {/* Right Actions: Approval & Fullscreen */}
      <div className="flex items-center gap-2.5">
        {/* Validation BAT */}
        <button
          onClick={() => setIsApproved(!isApproved)}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            isApproved
              ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50'
              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isApproved ? 'BAT Approuvé' : 'Valider la Maquette'}</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl text-dark-400 hover:text-dark-100 bg-dark-800 hover:bg-dark-750 transition-colors border border-dark-700/60"
          title="Plein écran"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Switch back to Studio */}
        <button
          onClick={onExitClientMode}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-dark-300 hover:text-gold-400 bg-dark-800/80 hover:bg-dark-800 transition-colors border border-dark-700/60"
          title="Revenir au mode studio créateur"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Éditeur</span>
        </button>
      </div>
    </header>
  );
};
