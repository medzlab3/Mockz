import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ClientHeader } from './components/ClientHeader';
import { Sidebar } from './components/Sidebar';
import { ControlsOverlay } from './components/ControlsOverlay';
import { ThreeCanvas, ThreeCanvasHandle } from './components/ThreeCanvas';
import { PrintFinishesModal } from './components/PrintFinishesModal';
import { ShareModal } from './components/ShareModal';
import { ClientCommentsModal } from './components/ClientCommentsModal';
import { BATApprovalModal } from './components/BATApprovalModal';
import { MessageSquare, RefreshCw } from 'lucide-react';
import {
  BookSettings,
  PageSlot,
  PageFormat,
  PaperFinish,
  PaperWeight,
  FORMAT_DIMENSIONS,
  ClientComment,
  CommentReply,
  BATApproval
} from './types';
import { generateSampleInvitationPages } from './utils/sampleData';
import { saveProjectToCloud, loadProjectFromCloud } from './utils/cloudSync';

const DEFAULT_SETTINGS: BookSettings = {
  format: 'a5',
  pageCount: 4,
  openAngle: 0,
  currentSpread: 0,
  coverPaperWeight: 350,
  coverPaperFinish: 'matte',
  insidePaperWeight: 120,
  insidePaperFinish: 'matte',
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
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [isClientMode] = useState<boolean>(() => {
    return urlParams.get('view') === 'client';
  });

  // Unique Project ID: provides total isolation between projects
  const [projectId] = useState<string>(() => {
    const fromUrl = urlParams.get('p') || urlParams.get('project');
    if (fromUrl) return fromUrl;
    const saved = localStorage.getItem('mockz_active_project_id');
    if (saved) return saved;
    const newId = `prj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    try {
      localStorage.setItem('mockz_active_project_id', newId);
    } catch { /* ignore */ }
    return newId;
  });

  // Ensure URL reflects projectId in studio mode
  useEffect(() => {
    if (!urlParams.get('p') && !isClientMode) {
      const url = new URL(window.location.href);
      url.searchParams.set('p', projectId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [projectId, isClientMode, urlParams]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Settings: default openAngle 0 and currentSpread 0 (closed on front cover)
  const [settings, setSettings] = useState<BookSettings>(() => {
    const fmt = urlParams.get('format') as PageFormat | null;
    const count = parseInt(urlParams.get('pages') || '0', 10);
    const weight = parseInt(urlParams.get('weight') || '0', 10) as PaperWeight;
    const finish = urlParams.get('finish') as PaperFinish | null;
    const angle = parseInt(urlParams.get('angle') || '-1', 10);
    const spread = parseInt(urlParams.get('spread') || '-1', 10);

    const base: BookSettings = { ...DEFAULT_SETTINGS };

    try {
      const saved = localStorage.getItem(`mockz_settings_${projectId}`);
      if (saved && !isClientMode) {
        Object.assign(base, JSON.parse(saved));
      }
    } catch { /* ignore */ }

    if (fmt && FORMAT_DIMENSIONS[fmt]) base.format = fmt;
    if (count >= 4 && count % 2 === 0) base.pageCount = count;
    if ([120, 250, 350].includes(weight)) {
      base.coverPaperWeight = weight;
      base.paperWeight = weight;
    }
    if (['matte', 'glossy', 'kraft', 'textured'].includes(finish || '')) {
      base.coverPaperFinish = finish!;
      base.paperFinish = finish!;
    }
    if (angle >= 0 && angle <= 180) {
      base.openAngle = angle;
    } else {
      base.openAngle = 0; // Default closed
    }
    if (spread >= 0) {
      base.currentSpread = spread;
    } else {
      base.currentSpread = 0; // Default cover
    }

    return base;
  });

  // Client loading indicator: in client mode, wait for cloud project before rendering
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(isClientMode);

  const [pages, setPages] = useState<PageSlot[]>(() => {
    try {
      const savedPages = localStorage.getItem(`mockz_pages_${projectId}`);
      if (savedPages && !isClientMode) {
        return JSON.parse(savedPages);
      }
    } catch { /* ignore */ }

    // Client mode starts with empty slots (waiting for cloud load)
    if (isClientMode) {
      return generatePageSlots(settings.pageCount || 4);
    }

    const sampleImages = generateSampleInvitationPages();
    const count = settings.pageCount || 4;
    const slots = generatePageSlots(count);
    return slots.map((s, idx) => ({
      ...s,
      imageUrl: sampleImages[idx] || null,
    }));
  });

  // Client Comments State
  const [comments, setComments] = useState<ClientComment[]>(() => {
    try {
      const saved = localStorage.getItem(`mockz_comments_${projectId}`);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  // BAT Approval State
  const [batApproval, setBatApproval] = useState<BATApproval | null>(() => {
    try {
      const saved = localStorage.getItem(`mockz_bat_${projectId}`);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
  });

  // Cloud status states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const isInitialMount = useRef(true);

  // Modals & Panels
  const [isFinishesModalOpen, setIsFinishesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isBATModalOpen, setIsBATModalOpen] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const threeCanvasRef = useRef<ThreeCanvasHandle>(null);

  // Initial load from Cloud Firestore
  useEffect(() => {
    let isCancelled = false;
    loadProjectFromCloud(projectId)
      .then((cloudProject) => {
        if (isCancelled) return;
        if (cloudProject) {
          if (cloudProject.settings) setSettings(cloudProject.settings);
          if (cloudProject.pages && cloudProject.pages.length > 0) setPages(cloudProject.pages);
          if (cloudProject.comments) setComments(cloudProject.comments);
          if (cloudProject.batApproval) setBatApproval(cloudProject.batApproval);
        }
        setIsLoadingCloud(false);
      })
      .catch((err) => {
        console.warn('Initial cloud fetch error:', err);
        if (!isCancelled) setIsLoadingCloud(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  // Sync to local project storage
  useEffect(() => {
    try {
      localStorage.setItem(`mockz_settings_${projectId}`, JSON.stringify(settings));
      localStorage.setItem(`mockz_pages_${projectId}`, JSON.stringify(pages));
      localStorage.setItem(`mockz_comments_${projectId}`, JSON.stringify(comments));
      if (batApproval) {
        localStorage.setItem(`mockz_bat_${projectId}`, JSON.stringify(batApproval));
      }
    } catch { /* ignore */ }
  }, [projectId, settings, pages, comments, batApproval]);

  // Debounced auto-save to Cloud Firestore
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setIsSavingCloud(true);
      await saveProjectToCloud(projectId, {
        id: projectId,
        settings,
        pages,
        comments,
        batApproval,
        updatedAt: new Date().toISOString(),
      });
      setIsSavingCloud(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [projectId, settings, pages, comments, batApproval]);

  // Manual refresh from Cloud (for client when designer made edits)
  const handleRefreshFromCloud = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await loadProjectFromCloud(projectId);
      if (data) {
        if (data.settings) setSettings(data.settings);
        if (data.pages && data.pages.length > 0) setPages(data.pages);
        if (data.comments) setComments(data.comments);
        if (data.batApproval) setBatApproval(data.batApproval);
        setExportMessage('Maquette actualisée avec les modifications du studio !');
        setTimeout(() => setExportMessage(null), 3500);
      } else {
        setExportMessage('Votre maquette est déjà à jour.');
        setTimeout(() => setExportMessage(null), 2500);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId]);

  // Immediate save before sharing
  const handleOpenShareModal = useCallback(async () => {
    setIsShareModalOpen(true);
    setIsSavingCloud(true);
    await saveProjectToCloud(projectId, {
      id: projectId,
      settings,
      pages,
      comments,
      batApproval,
      updatedAt: new Date().toISOString(),
    });
    setIsSavingCloud(false);
  }, [projectId, settings, pages, comments, batApproval]);

  const updateSettings = useCallback((patch: Partial<BookSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleUpdatePageImage = useCallback((pageIndex: number, imageUrl: string | null) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === pageIndex ? { ...p, imageUrl } : p))
    );
  }, []);

  // Reorder page card (move up / down / drag)
  const handleReorderPage = useCallback((fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);

      const freshSlots = generatePageSlots(updated.length);
      return updated.map((item, idx) => ({
        ...freshSlots[idx],
        imageUrl: item.imageUrl,
      }));
    });
  }, []);

  // Batch delete selected pages in lots of 4
  const handleDeletePages = useCallback((indicesToDelete: number[]) => {
    if (indicesToDelete.length === 0 || indicesToDelete.length % 4 !== 0) return;

    setPages((prev) => {
      const remaining = prev.filter((_, idx) => !indicesToDelete.includes(idx));
      if (remaining.length < 4) return prev;

      const freshSlots = generatePageSlots(remaining.length);
      const reindexed = freshSlots.map((slot, idx) => ({
        ...slot,
        imageUrl: remaining[idx]?.imageUrl || null,
      }));

      setSettings((s) => {
        const newSheets = Math.ceil(reindexed.length / 2);
        return {
          ...s,
          pageCount: reindexed.length,
          currentSpread: Math.min(newSheets, s.currentSpread ?? 0),
        };
      });

      setExportMessage(`${indicesToDelete.length} pages supprimées avec succès !`);
      setTimeout(() => setExportMessage(null), 3500);

      return reindexed;
    });
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
      openAngle: 0,
      currentSpread: 0,
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
      coverPaperWeight: 350,
      coverPaperFinish: 'matte',
      insidePaperWeight: 120,
      insidePaperFinish: 'matte',
      paperWeight: 350,
      paperFinish: 'matte',
      openAngle: 0,
      currentSpread: 0,
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

  // Comments handlers
  const handleAddComment = useCallback((newComment: Omit<ClientComment, 'id' | 'createdAt'>) => {
    const comment: ClientComment = {
      ...newComment,
      id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setComments((prev) => [comment, ...prev]);
  }, []);

  // Studio reply to comment
  const handleAddReply = useCallback((commentId: string, replyText: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const newReply: CommentReply = {
          id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          author: 'Studio Mockz',
          text: replyText,
          createdAt: new Date().toISOString(),
        };
        return {
          ...c,
          replies: [...(c.replies || []), newReply],
        };
      })
    );
  }, []);

  const handleDeleteComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleToggleResolveComment = useCallback((id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  }, []);

  // BAT handler
  const handleSaveBAT = useCallback((approval: BATApproval) => {
    setBatApproval(approval);
    setExportMessage('Bon À Tirer (BAT) validé et enregistré !');
    setTimeout(() => setExportMessage(null), 4000);
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
  const currentSpread = settings.currentSpread ?? 0;

  const canPrevPage = currentSpread > 0;
  const canNextPage = currentSpread < numSheets;

  const handlePrevPage = useCallback(() => {
    setSettings((prev) => {
      const cur = prev.currentSpread ?? 0;
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
      const cur = prev.currentSpread ?? 0;
      if (cur >= numS) return prev;
      const nextSpread = cur + 1;
      return {
        ...prev,
        currentSpread: nextSpread,
        openAngle: nextSpread === numS ? 0 : Math.max(75, prev.openAngle === 0 ? 90 : prev.openAngle),
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

  const activeSpreadPage = useMemo(() => {
    if (currentSpread === 0) return 1;
    if (currentSpread === numSheets) return settings.pageCount;
    return currentSpread * 2;
  }, [currentSpread, numSheets, settings.pageCount]);

  const activeCommentsCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="flex flex-col h-full w-full bg-dark-950 text-dark-50 overflow-hidden font-sans">
      {exportMessage && (
        <div className="fixed top-20 right-4 lg:right-6 z-50 bg-emerald-500/95 text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Client Loading Screen */}
      {isClientMode && isLoadingCloud ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-dark-950 text-dark-100 gap-4 p-6 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shadow-xl shadow-gold-500/10">
            <RefreshCw className="w-6 h-6 animate-spin text-gold-400" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-dark-50">Chargement de votre maquette 3D</h2>
            <p className="text-xs text-dark-400">Récupération des visuels et finitions depuis le Studio Mockz...</p>
          </div>
        </div>
      ) : (
        <>
          {isClientMode ? (
            <ClientHeader
              settings={settings}
              commentsCount={activeCommentsCount}
              batApproval={batApproval}
              onOpenFinishesModal={() => setIsFinishesModalOpen(true)}
              onOpenCommentsModal={() => setIsCommentsModalOpen(true)}
              onOpenBATModal={() => setIsBATModalOpen(true)}
              onRefresh={handleRefreshFromCloud}
              onCenterInView={() => threeCanvasRef.current?.centerInView()}
              isRefreshing={isRefreshing}
            />
          ) : (
            <Header
              settings={settings}
              commentsCount={activeCommentsCount}
              batApproval={batApproval}
              isSavingCloud={isSavingCloud}
              onUpdateSettings={updateSettings}
              onExport={handleExport}
              onResetCamera={(preset) => threeCanvasRef.current?.resetCamera(preset)}
              onCenterInView={() => threeCanvasRef.current?.centerInView()}
              onOpenFinishesModal={() => setIsFinishesModalOpen(true)}
              onOpenCommentsModal={() => setIsCommentsModalOpen(true)}
              onOpenBATModal={() => setIsBATModalOpen(true)}
              onOpenShareModal={handleOpenShareModal}
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
                onReorderPage={handleReorderPage}
                onDeletePages={handleDeletePages}
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
                onCenterInView={() => threeCanvasRef.current?.centerInView()}
              />

              {/* Floating Action Button (FAB) for Collapsible Comments Panel - Placed above bottom bar on mobile */}
              <button
                type="button"
                onClick={() => setIsCommentsModalOpen((prev) => !prev)}
                className={`absolute bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 p-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-bold text-xs transition-all active:scale-95 border ${
                  isCommentsModalOpen
                    ? 'bg-dark-800 text-gold-400 border-gold-400/40 shadow-black'
                    : 'bg-gold-400 hover:bg-gold-300 text-dark-950 border-gold-300 shadow-gold-500/20 hover:scale-105'
                }`}
                title={isCommentsModalOpen ? 'Masquer les remarques' : 'Ouvrir les remarques & annotations'}
              >
                <MessageSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {isCommentsModalOpen ? 'Fermer' : 'Commentaires'}
                </span>
                {activeCommentsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-dark-950 text-gold-400 font-mono text-[10px] font-bold flex items-center justify-center border border-gold-400/30">
                    {activeCommentsCount}
                  </span>
                )}
              </button>
            </main>
          </div>

          <PrintFinishesModal
            isOpen={isFinishesModalOpen}
            onClose={() => setIsFinishesModalOpen(false)}
            settings={settings}
            onUpdateSettings={updateSettings}
          />

          {/* Collapsible Comments Side Panel Drawer */}
          <ClientCommentsModal
            isOpen={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
            comments={comments}
            pages={pages}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onDeleteComment={handleDeleteComment}
            onToggleResolveComment={handleToggleResolveComment}
            isClientMode={isClientMode}
            activeSpreadPage={activeSpreadPage}
          />

          <BATApprovalModal
            isOpen={isBATModalOpen}
            onClose={() => setIsBATModalOpen(false)}
            settings={settings}
            batApproval={batApproval}
            onSaveBAT={handleSaveBAT}
          />

          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            settings={settings}
            projectId={projectId}
            onSwitchToClientMode={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'client');
              url.searchParams.set('p', projectId);
              window.location.href = url.toString();
            }}
          />
        </>
      )}
    </div>
  );
}

export default App;
