import React, { useState } from 'react';
import {
  MessageSquare,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  CornerDownRight,
  Send,
  CheckCheck,
  Filter,
  ChevronRight
} from 'lucide-react';
import { ClientComment, PageSlot } from '../types';

interface ClientCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: ClientComment[];
  pages: PageSlot[];
  onAddComment: (comment: Omit<ClientComment, 'id' | 'createdAt'>) => void;
  onAddReply?: (commentId: string, replyText: string) => void;
  onDeleteComment?: (id: string) => void;
  onToggleResolveComment?: (id: string) => void;
  isClientMode: boolean;
  activeSpreadPage?: number | null;
}

export const ClientCommentsModal: React.FC<ClientCommentsModalProps> = ({
  isOpen,
  onClose,
  comments,
  pages,
  onAddComment,
  onAddReply,
  onDeleteComment,
  onToggleResolveComment,
  isClientMode,
  activeSpreadPage,
}) => {
  const [selectedPage, setSelectedPage] = useState<number | 'all'>('all');
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('mockz_author_name') || (isClientMode ? 'Client' : 'Studio Mockz');
  });
  const [commentText, setCommentText] = useState('');
  const [filterPage, setFilterPage] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  const [copied, setCopied] = useState(false);

  // Replying state (for studio)
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const quickTags = [
    'Correction texte',
    'Ajuster cadrage',
    'Couleurs / Teinte',
    'Qualité image',
    'Choix papier',
  ];

  const handleQuickTagClick = (tag: string) => {
    if (commentText.includes(tag)) return;
    setCommentText((prev) => (prev ? `${prev} [${tag}]` : `[${tag}] `));
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      localStorage.setItem('mockz_author_name', authorName);
    } catch { /* ignore */ }

    onAddComment({
      pageIndex: selectedPage,
      author: authorName.trim() || (isClientMode ? 'Client' : 'Studio'),
      text: commentText.trim(),
      resolved: false,
    });

    setCommentText('');
  };

  const handleSubmitReply = (commentId: string) => {
    if (!replyText.trim() || !onAddReply) return;
    onAddReply(commentId, replyText.trim());
    setReplyText('');
    setReplyingCommentId(null);
  };

  const filteredComments = comments.filter((c) => {
    if (filterPage !== 'all' && c.pageIndex !== filterPage) return false;
    if (filterStatus === 'pending' && c.resolved) return false;
    if (filterStatus === 'resolved' && !c.resolved) return false;
    return true;
  });

  const getFormattedSummary = () => {
    let summary = `📋 RETOURS & ANNOTATIONS MAQUETTE MOCKZ\nDate : ${new Date().toLocaleString('fr-FR')}\nTotal : ${comments.length} remarque(s)\n\n`;

    if (comments.length === 0) {
      return summary + 'Aucune remarque enregistrée.';
    }

    comments.forEach((c, idx) => {
      const pageLabel =
        c.pageIndex === 'all'
          ? 'Remarque Générale'
          : `Page ${c.pageIndex} (${pages.find((p) => p.index === c.pageIndex)?.label || 'Page'})`;
      const status = c.resolved ? '[RÉSOLU] ' : '[À CORRIGER] ';
      summary += `${idx + 1}. ${status}${pageLabel} - par ${c.author} :\n   "${c.text}"\n`;
      if (c.replies && c.replies.length > 0) {
        c.replies.forEach((r) => {
          summary += `   ↳ Réponse (${r.author}) : "${r.text}"\n`;
        });
      }
      summary += '\n';
    });

    return summary;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(getFormattedSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* Mobile-only backdrop (allows clicking outside to collapse on small screens) */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Collapsible Side Panel Drawer */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[420px] md:w-[460px] bg-dark-900/98 backdrop-blur-2xl border-l border-dark-700/80 shadow-2xl shadow-black flex flex-col select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 sm:p-5 border-b border-dark-700/60 flex items-center justify-between bg-dark-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center border border-gold-400/20">
              <MessageSquare className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-dark-50">
                  Commentaires &amp; Remarques
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-400 border border-gold-400/25">
                  {comments.length}
                </span>
              </div>
              <p className="text-[11px] text-dark-400">
                {isClientMode ? 'Partagez vos retours par page avec le studio' : 'Consultez et répondez aux demandes du client'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
            title="Masquer le volet de commentaires"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          
          {/* Quick page contextual action */}
          {activeSpreadPage && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-dark-850 border border-dark-750 text-xs">
              <span className="text-dark-300">
                Page vue : <strong className="text-gold-400">Page {activeSpreadPage}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedPage(activeSpreadPage)}
                className="text-[11px] font-bold text-gold-400 hover:text-gold-300 underline"
              >
                Commenter cette page
              </button>
            </div>
          )}

          {/* New Comment Form */}
          <form
            onSubmit={handleSubmitComment}
            className="bg-dark-850/80 border border-dark-700/60 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-dark-100 uppercase tracking-wider">
                Nouvelle remarque
              </span>
              <span className="text-[10px] text-dark-400">
                {isClientMode ? 'Client' : 'Studio'}
              </span>
            </div>

            {/* Target Page Selector & Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-dark-400 block mb-1">
                  Page concernée
                </label>
                <select
                  value={selectedPage}
                  onChange={(e) =>
                    setSelectedPage(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="w-full bg-dark-900 border border-dark-700/80 rounded-xl px-2.5 py-1.5 text-xs text-dark-200 focus:outline-none focus:border-gold-400"
                >
                  <option value="all">Remarque Générale (tout le projet)</option>
                  {pages.map((p) => (
                    <option key={p.index} value={p.index}>
                      P. {p.index} • {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-dark-400 block mb-1">
                  Votre nom
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex: Sophie M."
                  className="w-full bg-dark-900 border border-dark-700/80 rounded-xl px-2.5 py-1.5 text-xs text-dark-200 focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            {/* Quick tags */}
            <div>
              <span className="text-[10px] text-dark-400 block mb-1">Balises rapides :</span>
              <div className="flex flex-wrap gap-1">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-dark-300 hover:text-gold-400 border border-dark-700/60 transition-colors"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Décrivez précisément votre remarque ou la modification souhaitée..."
                rows={3}
                className="w-full bg-dark-900 border border-dark-700/80 rounded-xl p-3 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-gold-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!commentText.trim()}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gold-400 hover:bg-gold-300 text-dark-950 flex items-center justify-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publier la remarque</span>
            </button>
          </form>

          {/* Filters & Status tabs */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 bg-dark-850 p-1 rounded-xl border border-dark-750 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-gold-400 text-dark-950 shadow-sm'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                Tous ({comments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-amber-400 text-dark-950 shadow-sm'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                À corriger ({comments.filter((c) => !c.resolved).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('resolved')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterStatus === 'resolved'
                    ? 'bg-emerald-400 text-dark-950 shadow-sm'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                Validés ({comments.filter((c) => c.resolved).length})
              </button>
            </div>

            {/* Filter by page */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-dark-400" />
              <select
                value={filterPage}
                onChange={(e) =>
                  setFilterPage(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="bg-dark-850 border border-dark-750 rounded-lg px-2 py-1 text-[11px] text-dark-300 focus:outline-none"
              >
                <option value="all">Toutes pages</option>
                {pages.map((p) => (
                  <option key={p.index} value={p.index}>
                    P.{p.index}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {filteredComments.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-dark-850/50 border border-dark-750/50">
                <MessageSquare className="w-8 h-8 text-dark-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-dark-300">Aucun commentaire dans cette vue</p>
                <p className="text-[11px] text-dark-500 mt-1">
                  Les remarques ajoutées apparaîtront ici avec les réponses du studio.
                </p>
              </div>
            ) : (
              filteredComments.map((comment) => {
                const targetPage =
                  comment.pageIndex === 'all'
                    ? null
                    : pages.find((p) => p.index === comment.pageIndex);

                return (
                  <div
                    key={comment.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      comment.resolved
                        ? 'border-emerald-500/20 bg-dark-850/50 opacity-80'
                        : 'border-dark-700/80 bg-dark-850/90 shadow-md'
                    }`}
                  >
                    {/* Top row: Page badge & Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-dark-750 text-gold-400 border border-dark-700 font-mono">
                          {targetPage ? `Page ${comment.pageIndex}` : 'Général'}
                        </span>
                        {targetPage && (
                          <span className="text-[10px] text-dark-400 truncate max-w-[140px]">
                            {targetPage.label}
                          </span>
                        )}
                      </div>

                      {/* Status / Role-based action */}
                      <div className="flex items-center gap-1.5">
                        {!isClientMode && onToggleResolveComment ? (
                          <button
                            type="button"
                            onClick={() => onToggleResolveComment(comment.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                              comment.resolved
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                            }`}
                            title="Changer le statut"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>{comment.resolved ? 'Validée' : 'Marquer comme fait'}</span>
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                              comment.resolved
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{comment.resolved ? 'Validée par studio' : 'En attente'}</span>
                          </span>
                        )}

                        {!isClientMode && onDeleteComment && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(comment.id)}
                            className="p-1 rounded text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Supprimer la remarque"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Author & Timestamp */}
                    <div className="flex items-center gap-1.5 text-[10px] text-dark-400 mb-2">
                      <strong className="text-dark-200">{comment.author}</strong>
                      <span>•</span>
                      <span>{new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</span>
                    </div>

                    {/* Comment text */}
                    <p className="text-xs text-dark-100 leading-relaxed whitespace-pre-wrap">
                      {comment.text}
                    </p>

                    {/* Replies thread */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-dark-750/70 space-y-1.5 pl-3 border-l-2 border-l-gold-400/40">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="text-xs">
                            <div className="flex items-center gap-1.5 text-[10px] text-dark-400">
                              <CornerDownRight className="w-3 h-3 text-gold-400" />
                              <strong className="text-gold-400">{reply.author}</strong>
                              <span>•</span>
                              <span>{new Date(reply.createdAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}</span>
                            </div>
                            <p className="text-dark-200 pl-4 mt-0.5 text-xs">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Studio Reply Box (Only studio can reply) */}
                    {!isClientMode && onAddReply && (
                      <div className="mt-2.5 pt-2 border-t border-dark-750 flex flex-col gap-1.5">
                        {replyingCommentId === comment.id ? (
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Votre réponse au client..."
                              className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1 text-xs text-dark-100 focus:outline-none focus:border-gold-400"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmitReply(comment.id);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitReply(comment.id)}
                              className="px-2.5 py-1 bg-gold-400 text-dark-950 font-bold text-xs rounded-lg hover:bg-gold-300"
                            >
                              Répondre
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingCommentId(null);
                                setReplyText('');
                              }}
                              className="px-2 py-1 text-dark-400 text-xs hover:text-dark-200"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingCommentId(comment.id);
                              setReplyText('');
                            }}
                            className="text-[11px] font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 self-start"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>Répondre à cette remarque</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Footer: Summary Export (for studio) */}
        {!isClientMode && comments.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-dark-700/60 bg-dark-900/90 flex items-center justify-between">
            <span className="text-[11px] text-dark-400">
              {comments.length} remarque(s) au total
            </span>
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-gold-400 border border-dark-700/70 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier le récapitulatif'}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
