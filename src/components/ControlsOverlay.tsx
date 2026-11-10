import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sun,
  Moon,
  Layers,
  HelpCircle
} from 'lucide-react';
import { BookSettings } from '../types';

interface ControlsOverlayProps {
  settings: BookSettings;
  onUpdateSettings: (newSettings: Partial<BookSettings>) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  canPrevPage: boolean;
  canNextPage: boolean;
  currentSpreadLabel: string;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  settings,
  onUpdateSettings,
  onPrevPage,
  onNextPage,
  canPrevPage,
  canNextPage,
  currentSpreadLabel,
}) => {
  return (
    <div className="absolute bottom-4 sm:bottom-6 inset-x-0 pointer-events-none flex flex-col items-center gap-2 px-3 z-30 select-none">
      {/* Interaction tip - desktop only */}
      <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full bg-dark-900/80 border border-dark-700/50 text-[11px] text-dark-400 backdrop-blur-md shadow-sm pointer-events-auto">
        <HelpCircle className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
        <span>Glissez pour pivoter à 360° • Molette pour zoomer • Clic droit pour déplacer</span>
      </div>

      {/* Main Single-line Sleek Floating Capsule */}
      <div className="pointer-events-auto max-w-full overflow-x-auto custom-scrollbar">
        <div className="bg-dark-900/95 backdrop-blur-2xl border border-dark-600/40 rounded-2xl shadow-2xl shadow-black/90 p-1.5 sm:p-2 flex items-center gap-2 sm:gap-3 flex-nowrap whitespace-nowrap min-w-max">
          
          {/* Section 1: Page Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevPage}
              disabled={!canPrevPage}
              className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                canPrevPage
                  ? 'text-dark-200 hover:text-gold-400 hover:bg-dark-800'
                  : 'text-dark-600 opacity-40 cursor-not-allowed'
              }`}
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2.5 py-0.5 sm:py-1 rounded-xl bg-dark-800/90 border border-dark-700/60 text-center min-w-[80px] sm:min-w-[94px]">
              <span className="text-[9px] text-dark-400 uppercase font-semibold tracking-wider block leading-tight">
                Feuillet
              </span>
              <span className="text-xs font-bold text-gold-400 font-mono tracking-tight block leading-tight">
                {currentSpreadLabel}
              </span>
            </div>

            <button
              onClick={onNextPage}
              disabled={!canNextPage}
              className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                canNextPage
                  ? 'text-dark-200 hover:text-gold-400 hover:bg-dark-800'
                  : 'text-dark-600 opacity-40 cursor-not-allowed'
              }`}
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-dark-700/60" />

          {/* Section 2: Opening Angle Slider & Presets */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-dark-300 font-medium hidden md:inline">
                Ouverture
              </span>
              <input
                type="range"
                min="0"
                max="180"
                value={settings.openAngle}
                onChange={(e) => onUpdateSettings({ openAngle: Number(e.target.value) })}
                className="w-20 sm:w-28 md:w-32 cursor-pointer"
                title={`Angle d'ouverture : ${Math.round(settings.openAngle)}°`}
              />
              <span className="text-[11px] font-mono font-bold text-gold-400 bg-dark-800/90 px-1.5 py-0.5 rounded-lg border border-dark-700/60 min-w-[34px] text-center">
                {Math.round(settings.openAngle)}°
              </span>
            </div>

            {/* Angle presets */}
            <div className="flex items-center bg-dark-800/90 p-0.5 rounded-xl border border-dark-700/60">
              <button
                onClick={() => onUpdateSettings({ openAngle: 0 })}
                className={`px-2 py-1 text-[11px] rounded-lg transition-all ${
                  settings.openAngle === 0
                    ? 'bg-gold-400 text-dark-950 font-bold shadow-sm'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
                }`}
              >
                Fermé
              </button>
              <button
                onClick={() => onUpdateSettings({ openAngle: 90 })}
                className={`px-2 py-1 text-[11px] rounded-lg transition-all ${
                  settings.openAngle >= 75 && settings.openAngle <= 105
                    ? 'bg-gold-400 text-dark-950 font-bold shadow-sm'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
                }`}
              >
                90°
              </button>
              <button
                onClick={() => onUpdateSettings({ openAngle: 180 })}
                className={`px-2 py-1 text-[11px] rounded-lg transition-all ${
                  settings.openAngle === 180
                    ? 'bg-gold-400 text-dark-950 font-bold shadow-sm'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
                }`}
              >
                À plat
              </button>
            </div>
          </div>

          <div className="h-5 w-px bg-dark-700/60" />

          {/* Section 3: Rotation & Environment */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => onUpdateSettings({ autoRotate: !settings.autoRotate })}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold ${
                settings.autoRotate
                  ? 'bg-gold-400/20 text-gold-400 border border-gold-400/40 shadow-sm'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
              }`}
              title="Rotation 360° continue"
            >
              <RotateCw className={`w-3.5 h-3.5 ${settings.autoRotate ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">360°</span>
            </button>

            {/* Theme switcher */}
            <div className="flex items-center bg-dark-800/90 p-0.5 rounded-xl border border-dark-700/60">
              <button
                onClick={() => onUpdateSettings({ backgroundTheme: 'studio' })}
                className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                  settings.backgroundTheme === 'studio'
                    ? 'bg-dark-700 text-gold-400'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
                title="Studio Sombre (Prestige)"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateSettings({ backgroundTheme: 'light' })}
                className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                  settings.backgroundTheme === 'light'
                    ? 'bg-dark-700 text-gold-400'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
                title="Studio Clair"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateSettings({ backgroundTheme: 'transparent' })}
                className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                  settings.backgroundTheme === 'transparent'
                    ? 'bg-dark-700 text-gold-400'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
                title="Fond Transparent (Export PNG)"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
