import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ClientHeader } from './components/ClientHeader';
import { Sidebar } from './components/Sidebar';
import { ControlsOverlay } from './components/ControlsOverlay';
import { ThreeCanvas, ThreeCanvasHandle } from './components/ThreeCanvas';
import { PrintFinishesModal } from './components/PrintFinishesModal';
import { ShareModal } from './components/ShareModal';
import { BookSettings, PageSlot } from './types';
import { generateSampleInvitationPages } from './utils/sampleData';

const SETTINGS_STORAGE_KEY = 'mockz_settings_v3';

const DEFAULT_SETTINGS: BookSettings = {
  format: 'a5',
  pageCount: 4,
  openAngle: 90,
  currentSpread: 1,
  paperFinish: 'matte',
  paperWeight: 350,
  autoRotate: false,
  roughness: 0.75,
  metalness: 0.02,
  showShadows: true,
  backgroundTheme: 'studio',
};

function generatePageSlots(count: number): PageSlot[] {
  const slots: PageSlot[] = [];
  for (let i = 1; i <= count; i++) {
    const sheetNum = Math.ceil(i / 2);
    const isRecto = i % 2 === 1;

    let label = `Page ${i}`;
    let sublabel = `Feuille ${sheetNum} • ${isRecto ? 'Recto' : 'Verso'}`;
    let side: PageSlot['side'] = isRecto ? 'page-right' : 'page-left';

    if (i === 1) {
      label = '1ère de Couverture';
      sublabel = 'Feuille 1 • Recto (Face avant)';
      side = 'cover-front';
    } else if (i === 2) {
      label = '2ème de Couverture';
      sublabel = 'Feuille 1 • Verso (Intérieur gauche)';
      side = 'inside-left';
    } else if (count === 4 && i === 3) {
      label = 'Intérieur Droite';
      sublabel = 'Feuille 2 • Recto (Page droite)';
      side = 'inside-right';
    } else if (i === count - 1 && count > 4) {
      label = '3ème de Couverture';
      sublabel = `Feuille ${sheetNum} • Recto (Intérieur dos)`;
      side = 'page-left';
    } else if (i === count) {
      label = '4ème de Couverture (Dos)';
      sublabel = `Feuille ${sheetNum} • Verso (Face arrière)`;
      side = 'cover-back';
    }

    slots.push({
      index: i,
      label,
      sublabel,
      imageUrl: null,
      side,
    });
  }
  return slots;
}

export function App() {
  const [isClientMode, setIsClientMode] = useState<boolean>(() => {
    return new URLSearchParams(window.location.search).get('view') === 'client';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settings, setSettings] = useState<BookSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_SETTINGS;
  });

  const [pages, setPages] = useState<PageSlot[]>(() => {
    const sampleImages = generateSampleInvitationPages();
    const slots = generatePageSlots(4);
    return slots.map((s, idx) => ({
      ...s,
      imageUrl: sampleImages[idx] || null,
    }));
  });

  const [isFinishesModalOpen, setIsFinishesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const threeCanvasRef = useRef<ThreeCanvasHandle>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch { /* ignore */ }
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<BookSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleUpdatePageImage = useCallback((pageIndex: number, imageUrl: string | null) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === pageIndex ? { ...p, imageUrl } : p))
    );
  }, []);

  const handleApplyPdfPages = useCallback((images: string[]) => {
    const neededPages = Math.max(4, Math.ceil(images.length / 2) * 2);
    const freshSlots = generatePageSlots(neededPages);
    const newPages = freshSlots.map((slot, idx) => ({
      ...slot,
      imageUrl: images[idx] || null,
    }));

    setSettings((prev) => ({
      ...prev,
      pageCount: neededPages,
      openAngle: 90,
      currentSpread: 1,
    }));
    setPages(newPages);
  }, []);

  const handleLoadSampleDesign = useCallback(() => {
    const sampleImages = generateSampleInvitationPages();
    const slots = generatePageSlots(4);
    const newPages = slots.map((s, idx) => ({
      ...s,
      imageUrl: sampleImages[idx] || null,
    }));
    setSettings((prev) => ({
      ...prev,
      pageCount: 4,
      paperWeight: 350,
      paperFinish: 'matte',
      openAngle: 90,
      currentSpread: 1,
    }));
    setPages(newPages);
  }, []);

  const handleResetProject = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS, currentSpread: 0, openAngle: 0 });
    setPages(generatePageSlots(4));
  }, []);

  const handlePageCountChange = useCallback((newCount: number) => {
    setSettings((prev) => ({
      ...prev,
      pageCount: newCount,
      currentSpread: 1,
      openAngle: 90,
    }));
    setPages((prev) => {
      const freshSlots = generatePageSlots(newCount);
      return freshSlots.map((slot) => {
        const existing = prev.find((p) => p.index === slot.index);
        return {
          ...slot,
          imageUrl: existing ? existing.imageUrl : null,
        };
      });
    });
  }, []);

  const handleExport = useCallback(() => {
    if (!threeCanvasRef.current) return;
    const dataUrl = threeCanvasRef.current.exportImage('png');
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `mockz-render-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    setExportMessage('Rendu HD exporté avec succès !');
    setTimeout(() => setExportMessage(null), 3500);
  }, []);

  const numSheets = Math.ceil(settings.pageCount / 2);
  const currentSpread = settings.currentSpread ?? (settings.openAngle === 0 ? 0 : 1);

  const canPrevPage = currentSpread > 0;
  const canNextPage = currentSpread < numSheets;

  const handlePrevPage = useCallback(() => {
    setSettings((prev) => {
      const cur = prev.currentSpread ?? 1;
      if (cur <= 0) return prev;
      const nextSpread = cur - 1;
      return {
        ...prev,
        currentSpread: nextSpread,
        openAngle: nextSpread === 0 ? 0 : Math.max(75, prev.openAngle),
      };
    });
  }, []);

  const handleNextPage = useCallback(() => {
    setSettings((prev) => {
      const numS = Math.ceil(prev.pageCount / 2);
      const cur = prev.currentSpread ?? 1;
      if (cur >= numS) return prev;
      const nextSpread = cur + 1;
      return {
        ...prev,
        currentSpread: nextSpread,
        openAngle: nextSpread === numS ? 0 : Math.max(75, prev.openAngle),
      };
    });
  }, []);

  const currentSpreadLabel = useMemo(() => {
    if (currentSpread === 0) {
      return 'Fermé • Couv.';
    }
    if (currentSpread === numSheets) {
      return `Fermé • Dos`;
    }
    const leftPage = currentSpread * 2;
    const rightPage = leftPage + 1;
    return `P. ${leftPage} — ${rightPage}`;
  }, [currentSpread, numSheets]);

  return (
    <div className="flex flex-col h-full w-full bg-dark-950 text-dark-50 overflow-hidden font-sans">
      {exportMessage && (
        <div className="fixed top-20 right-4 lg:right-6 z-50 bg-emerald-500/95 text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{exportMessage}</span>
        </div>
      )}

      {isClientMode ? (
        <ClientHeader
          settings={settings}
          onExitClientMode={() => {
            setIsClientMode(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            window.history.pushState({}, '', url.toString());
          }}
        />
      ) : (
        <Header
          settings={settings}
          onUpdateSettings={updateSettings}
          onExport={handleExport}
          onResetCamera={(preset) => threeCanvasRef.current?.resetCamera(preset)}
          onOpenFinishesModal={() => setIsFinishesModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {!isClientMode && (
          <Sidebar
            settings={settings}
            pages={pages}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onUpdateSettings={updateSettings}
            onUpdatePageImage={handleUpdatePageImage}
            onApplyPdfPages={handleApplyPdfPages}
            onLoadSampleDesign={handleLoadSampleDesign}
            onResetProject={handleResetProject}
            onPageCountChange={handlePageCountChange}
          />
        )}

        <main className="flex-1 relative h-full">
          <ThreeCanvas
            ref={threeCanvasRef}
            settings={settings}
            pages={pages}
          />
          <ControlsOverlay
            settings={settings}
            onUpdateSettings={updateSettings}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            canPrevPage={canPrevPage}
            canNextPage={canNextPage}
            currentSpreadLabel={currentSpreadLabel}
          />
        </main>
      </div>

      <PrintFinishesModal
        isOpen={isFinishesModalOpen}
        onClose={() => setIsFinishesModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        settings={settings}
        onSwitchToClientMode={() => {
          setIsClientMode(true);
          const url = new URL(window.location.href);
          url.searchParams.set('view', 'client');
          window.history.pushState({}, '', url.toString());
        }}
      />
    </div>
  );
}

export default App;
