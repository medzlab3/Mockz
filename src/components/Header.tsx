import React from 'react';
import {
  BookOpen,
  Camera,
  Sparkles,
  Download,
  Share2,
  Menu,
  MessageSquare,
  FileCheck,
  Cloud
} from 'lucide-react';
import { BookSettings, PageFormat, FORMAT_DIMENSIONS, BATApproval } from '../types';

interface HeaderProps {
  settings: BookSettings;
  commentsCount: number;
  batApproval: BATApproval | null;
  isSavingCloud?: boolean;
  onUpdateSettings: (newSettings: Partial<BookSettings>) => void;
  onExport: () => void;
  onResetCamera: (preset: 'perspective' | 'front' | 'spine') => void;
  onOpenFinishesModal: () => void;
  onOpenCommentsModal: () => void;
  onOpenBATModal: () => void;
  onOpenShareModal: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  commentsCount,
  batApproval,
  isSavingCloud = false,
  onUpdateSettings,
  onExport,
  onResetCamera,
  onOpenFinishesModal,
  onOpenCommentsModal,
  onOpenBATModal,
  onOpenShareModal,
  onToggleSidebar,
}) => {
  const coverWeight = settings.coverPaperWeight || settings.paperWeight || 350;
  const coverFinish = settings.coverPaperFinish || settings.paperFinish || 'matte';

  return (
    <header className="h-14 sm:h-16 border-b border-dark-700/60 bg-dark-900/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-20 select-none">
      {/* Left: Brand + Hamburger */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-dark-400 hover:text-gold-400 hover:bg-dark-800 transition-colors"
          title="Ouvrir le panneau des pages"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-gold-500 to-gold-400 flex items-center justify-center shadow-lg shadow-gold-500/20 text-dark-950 font-black">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-dark-950" />
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-tight text-dark-50">Mockz</span>
            <span className="hidden sm:inline text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-400 border border-gold-400/25">
              3D Print Studio
            </span>

            {/* Cloud Sync Indicator */}
            <span
              className={`hidden md:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                isSavingCloud
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                  : 'bg-dark-800 text-dark-400 border-dark-700/60'
              }`}
              title="Vos modifications sont automatiquement synchronisées pour le client"
            >
              <Cloud className="w-3 h-3" />
              <span>{isSavingCloud ? 'Synchronisation...' : 'En ligne'}</span>
            </span>

            {batApproval?.approved && (
              <button
                type="button"
                onClick={onOpenBATModal}
                className="hidden md:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                title="Voir le certificat BAT signé"
              >
                <FileCheck className="w-3 h-3" />
                <span>BAT Signé</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-dark-400 hidden md:block">Mockup interactif &amp; simulation d'impression</p>
        </div>
      </div>

      {/* Center Controls: Format & Views (Desktop) */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Format Selector */}
        <div className="flex items-center bg-dark-800/90 p-1 rounded-xl border border-dark-700/60">
          {(Object.keys(FORMAT_DIMENSIONS) as PageFormat[]).map((fmt) => {
            const isSelected = settings.format === fmt;
            return (
              <button
                key={fmt}
                onClick={() => onUpdateSettings({ format: fmt })}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-gold-400 text-dark-950 shadow-sm'
                    : 'text-dark-300 hover:text-dark-50 hover:bg-dark-700/50'
                }`}
                title={FORMAT_DIMENSIONS[fmt].label}
              >
                {fmt === 'a5' && 'A5'}
                {fmt === 'a4' && 'A4'}
                {fmt === 'square' && 'Carré'}
                {fmt === 'landscape' && 'Paysage'}
              </button>
            );
          })}
        </div>

        {/* Quick Camera Views */}
        <div className="flex items-center bg-dark-800/90 p-1 rounded-xl border border-dark-700/60">
          <button
            onClick={() => onResetCamera('perspective')}
            className="px-2.5 py-1 rounded-lg text-xs text-dark-300 hover:text-gold-400 hover:bg-dark-700/50 transition-all flex items-center gap-1.5 font-medium"
            title="Vue perspective"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Perspective</span>
          </button>
          <button
            onClick={() => onResetCamera('front')}
            className="px-2.5 py-1 rounded-lg text-xs text-dark-300 hover:text-gold-400 hover:bg-dark-700/50 transition-all font-medium"
            title="Vue face"
          >
            Face
          </button>
          <button
            onClick={() => onResetCamera('spine')}
            className="px-2.5 py-1 rounded-lg text-xs text-dark-300 hover:text-gold-400 hover:bg-dark-700/50 transition-all font-medium"
            title="Vue tranche"
          >
            Tranche
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Retours Client */}
        <button
          onClick={onOpenCommentsModal}
          className="relative hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-dark-800/90 hover:bg-dark-750 text-dark-200 hover:text-gold-400 border border-dark-750 hover:border-gold-400/40 transition-all shadow-sm"
          title="Consulter et gérer les remarques / retours"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Retours</span>
          {commentsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-gold-400 text-dark-950 font-mono text-[9px] font-bold flex items-center justify-center">
              {commentsCount}
            </span>
          )}
        </button>

        {/* Papiers & Finitions */}
        <button
          onClick={onOpenFinishesModal}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold bg-dark-800/90 hover:bg-dark-750 text-gold-400 border border-gold-400/30 transition-all shadow-sm"
          title="Modifier le papier et la finition"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span className="hidden sm:inline">Papiers &amp; Finitions</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-400/15 text-gold-400 font-mono hidden md:inline">
            {coverWeight}g • {coverFinish}
          </span>
        </button>

        {/* Partager au Client */}
        <button
          onClick={onOpenShareModal}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-dark-800/90 hover:bg-dark-750 text-dark-200 hover:text-gold-400 border border-dark-700/60 hover:border-gold-400/40 transition-all shadow-sm"
          title="Générer un lien de présentation pour le client"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Partager</span>
        </button>

        {/* Exporter HD */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-gold-400 hover:bg-gold-300 text-dark-950 transition-all shadow-lg shadow-gold-500/20 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter HD</span>
        </button>
      </div>
    </header>
  );
};
