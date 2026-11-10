import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sun,
  Moon,
  Layers,
  HelpCircle,
  Focus
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
  onCenterInView: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  settings,
  onUpdateSettings,
  onPrevPage,
  onNextPage,
  canPrevPage,
  canNextPage,
  currentSpreadLabel,
  onCenterInView,
}) => {
  return (
    <div className="absolute bottom-3 sm:bottom-6 inset-x-0 pointer-events-none flex flex-col items-center gap-1.5 px-2 sm:px-4 z-30 select-none">
      {/* Desktop interaction hint */}
      <div className="hidden xl:flex items-center gap-2 px-3.5 py-1 rounded-full bg-dark-900/80 border border-dark-700/50 text-[11px] text-dark-400 backdrop-blur-md shadow-sm pointer-events-auto">
        <HelpCircle className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
        <span>Glissez pour pivoter à 360° • Molette pour zoomer • Clic droit pour déplacer</span>
      </div>

      {/* Main Single-line Responsive Floating Capsule - Always Centered, Never Crops */}
      <div className="pointer-events-auto w-auto max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] flex justify-center">
        <div className="bg-dark-900/95 backdrop-blur-2xl border border-dark-600/40 rounded-2xl shadow-2xl shadow-black/90 p-1 sm:p-2 flex items-center gap-1.5 sm:gap-2.5 flex-nowrap">
          
          {/* Section 1: Page Navigation */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <button
              onClick={onPrevPage}
              disabled={!canPrevPage}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all ${
                canPrevPage
                  ? 'text-dark-200 hover:text-gold-400 hover:bg-dark-800'
                  : 'text-dark-600 opacity-30 cursor-not-allowed'
              }`}
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-dark-800/90 border border-dark-700/60 text-center min-w-[62px] sm:min-w-[88px]">
              <span className="text-[8px] sm:text-[9px] text-dark-400 uppercase font-semibold tracking-wider block leading-tight hidden xs:block">
                Feuillet
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-gold-400 font-mono tracking-tight block leading-tight">
                {currentSpreadLabel}
              </span>
            </div>

            <button
              onClick={onNextPage}
              disabled={!canNextPage}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all ${
                canNextPage
                  ? 'text-dark-200 hover:text-gold-400 hover:bg-dark-800'
                  : 'text-dark-600 opacity-30 cursor-not-allowed'
              }`}
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 sm:h-5 w-px bg-dark-700/60 flex-shrink-0" />

          {/* Section 2: Opening Angle Slider & Presets */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[11px] text-dark-300 font-medium hidden md:inline">
                Ouverture
              </span>
              <input
                type="range"
                min="0"
                max="180"
                value={settings.openAngle}
                onChange={(e) => onUpdateSettings({ openAngle: Number(e.target.value) })}
                className="w-14 sm:w-24 md:w-28 cursor-pointer accent-gold-400"
                title={`Angle d'ouverture : ${Math.round(settings.openAngle)}°`}
              />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-gold-400 bg-dark-800/90 px-1 sm:px-1.5 py-0.5 rounded-lg border border-dark-700/60 min-w-[30px] sm:min-w-[34px] text-center">
                {Math.round(settings.openAngle)}°
              </span>
            </div>

            {/* Presets: Compact on mobile, labeled on desktop */}
            <div className="flex items-center bg-dark-800/90 p-0.5 rounded-lg sm:rounded-xl border border-dark-700/60">
              <button
                onClick={() => onUpdateSettings({ openAngle: 0 })}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] rounded-md sm:rounded-lg transition-all ${
                  settings.openAngle === 0
                    ? 'bg-gold-400 text-dark-950 font-bold shadow-sm'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
                }`}
                title="Livre fermé (0°)"
              >
                Fermé
              </button>
              <button
                onClick={() => onUpdateSettings({ openAngle: 90 })}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] rounded-md sm:rounded-lg transition-all ${
                  settings.openAngle >= 75 && settings.openAngle <= 105
                    ? 'bg-gold-400 text-dark-950 font-bold shadow-sm'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
                }`}
                title="Livre entrouvert (90°)"
              >
                90°
              </button>
              <button
                onClick={() => onUpdateSettings({ openAngle: 180 })}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] rounded-md sm:rounded-lg transition-all ${
                  settings.openAngle === 180
                    ? 'bg-gold-400 text-dark-950 font-bold shadow-sm'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
                }`}
                title="Livre à plat (180°)"
              >
                À plat
              </button>
            </div>
          </div>

          <div className="h-4 sm:h-5 w-px bg-dark-700/60 flex-shrink-0" />

          {/* Section 3: Center in View (Recentrer) Button */}
          <button
            type="button"
            onClick={onCenterInView}
            className="p-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-dark-300 hover:text-gold-400 hover:bg-dark-800 transition-all flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
            title="Recentrer le livre dans le viewport (Center in View)"
          >
            <Focus className="w-3.5 h-3.5 text-gold-400" />
            <span className="hidden sm:inline">Recentrer</span>
          </button>

          {/* Section 4: 360° Auto-rotation */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ autoRotate: !settings.autoRotate })}
            className={`p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl transition-all flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${
              settings.autoRotate
                ? 'bg-gold-400/20 text-gold-400 border border-gold-400/40 shadow-sm'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
            }`}
            title="Rotation 360° continue"
          >
            <RotateCw className={`w-3.5 h-3.5 ${settings.autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">360°</span>
          </button>

          {/* Section 5: Theme switcher (Desktop) */}
          <div className="hidden sm:flex items-center bg-dark-800/90 p-0.5 rounded-xl border border-dark-700/60 flex-shrink-0">
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
  );
};
