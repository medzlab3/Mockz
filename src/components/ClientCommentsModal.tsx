import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Upload,
  User,
  Clock,
  CornerDownRight,
  Send,
  CheckCheck
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
}) => {
  const [selectedPage, setSelectedPage] = useState<number | 'all'>('all');
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('mockz_author_name') || (isClientMode ? 'Client' : 'Studio Mockz');
  });
  const [commentText, setCommentText] = useState('');
  const [filterPage, setFilterPage] = useState<number | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importText, setImportText] = useState('');

  // Replying state (for studio)
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  if (!isOpen) return null;

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
    if (filterPage === 'all') return true;
    return c.pageIndex === filterPage;
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

  const handleDownloadSummary = () => {
    const element = document.createElement('a');
    const file = new Blob([getFormattedSummary()], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Retours_Mockz_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImportText = () => {
    if (!importText.trim()) return;
    try {
      if (importText.trim().startsWith('[') || importText.trim().startsWith('{')) {
        const parsed = JSON.parse(importText);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        list.forEach((item: any) => {
          if (item.text) {
            onAddComment({
              pageIndex: item.pageIndex ?? 'all',
              author: item.author || 'Client',
              text: item.text,
              resolved: !!item.resolved,
            });
          }
        });
      } else {
        const lines = importText.split('\n').filter((l) => l.trim().length > 0);
        lines.forEach((line) => {
          onAddComment({
            pageIndex: 'all',
            author: 'Client',
            text: line.trim(),
            resolved: false,
          });
        });
      }
      setImportText('');
      setShowImportBox(false);
    } catch {
      alert('Format invalide. Veuillez coller une liste de retours ou du JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="bg-dark-900 border border-dark-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-dark-700/60 flex items-center justify-between bg-dark-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center border border-gold-400/20">
              <MessageSquare className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-dark-50 flex items-center gap-2">
                <span>{isClientMode ? 'Vos Retours & Remarques' : 'Retours & Échanges Client'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-dark-800 text-gold-400 border border-dark-700/80">
                  {comments.length}
                </span>
              </h3>
              <p className="text-xs text-dark-400">
                {isClientMode
                  ? 'Notez vos observations page par page pour le graphiste'
                  : 'Consultez les demandes du client, répondez et validez les corrections'}
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Form to Add Comment */}
          <form
            onSubmit={handleSubmitComment}
            className="bg-dark-850/80 rounded-xl p-4 border border-dark-700/70 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>{isClientMode ? 'Ajouter une remarque' : 'Ajouter une note / consigne'}</span>
              </span>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-dark-400" />
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Votre nom"
                  className="bg-dark-800 text-[11px] px-2.5 py-1 rounded-lg border border-dark-700 text-dark-100 focus:outline-none focus:border-gold-400 w-28 sm:w-36"
                />
              </div>
            </div>

            {/* Target Page Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs text-dark-300 font-medium whitespace-nowrap">
                Concerne la page :
              </label>
              <select
                value={selectedPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPage(val === 'all' ? 'all' : parseInt(val, 10));
                }}
                className="bg-dark-800 border border-dark-700/80 text-dark-100 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-gold-400 flex-1"
              >
                <option value="all">Remarque Générale (Tout le livret)</option>
                {pages.map((p) => (
                  <option key={p.index} value={p.index}>
                    Page {p.index} • {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick tags */}
            {isClientMode && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleQuickTagClick(tag)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-dark-800 hover:bg-dark-750 text-dark-300 hover:text-gold-400 border border-dark-700/60 transition-colors"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Textarea */}
            <div>
              <textarea
                rows={2}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  isClientMode
                    ? "Ex: Corriger la date en page 3, ajuster le logo un peu plus haut..."
                    : "Ex: Note technique ou remarque interne pour le projet..."
                }
                className="w-full bg-dark-800 border border-dark-700/80 rounded-xl px-3 py-2 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-gold-400 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gold-400 hover:bg-gold-300 disabled:opacity-40 disabled:pointer-events-none text-dark-950 transition-all shadow-md shadow-gold-500/20 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publier la remarque</span>
              </button>
            </div>
          </form>

          {/* Filter Bar & Export Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dark-750">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-dark-400">Filtrer :</span>
              <select
                value={filterPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterPage(val === 'all' ? 'all' : parseInt(val, 10));
                }}
                className="bg-dark-800 text-[11px] text-dark-200 border border-dark-700 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="all">Toutes ({comments.length})</option>
                {pages.map((p) => {
                  const pageCount = comments.filter((c) => c.pageIndex === p.index).length;
                  if (pageCount === 0) return null;
                  return (
                    <option key={p.index} value={p.index}>
                      P. {p.index} ({pageCount})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1 text-[11px] font-semibold text-dark-300 hover:text-gold-400 bg-dark-800 hover:bg-dark-750 px-2.5 py-1 rounded-lg border border-dark-700 transition-colors"
                title="Copier le récapitulatif des retours"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSummary}
                className="flex items-center gap-1 text-[11px] font-semibold text-dark-300 hover:text-gold-400 bg-dark-800 hover:bg-dark-750 px-2.5 py-1 rounded-lg border border-dark-700 transition-colors"
                title="Télécharger en fichier texte"
              >
                <Download className="w-3 h-3" />
                <span>Télécharger</span>
              </button>

              {!isClientMode && (
                <button
                  type="button"
                  onClick={() => setShowImportBox(!showImportBox)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-dark-300 hover:text-gold-400 bg-dark-800 hover:bg-dark-750 px-2.5 py-1 rounded-lg border border-dark-700 transition-colors"
                  title="Importer des retours reçus"
                >
                  <Upload className="w-3 h-3" />
                  <span>Importer</span>
                </button>
              )}
            </div>
          </div>

          {/* Import Box in Studio Mode */}
          {showImportBox && !isClientMode && (
            <div className="p-3 bg-dark-800/90 rounded-xl border border-dark-700 space-y-2">
              <span className="text-xs font-semibold text-dark-200 block">
                Coller des retours reçus du client :
              </span>
              <textarea
                rows={3}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Collez ici les retours du client (liste à puces ou texte)..."
                className="w-full bg-dark-900 border border-dark-700 text-xs p-2 rounded-lg text-dark-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportBox(false)}
                  className="px-3 py-1 rounded-lg text-xs text-dark-400 hover:bg-dark-750"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleImportText}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-gold-400 text-dark-950 hover:bg-gold-300"
                >
                  Valider l'import
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {filteredComments.length === 0 ? (
              <div className="text-center py-8 text-dark-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">Aucune remarque enregistrée pour le moment.</p>
                <p className="text-[11px] text-dark-500">
                  {isClientMode
                    ? "Vos remarques apparaîtront ici et seront transmises au graphiste."
                    : "Les retours laissés par votre client s'afficheront ici en direct."}
                </p>
              </div>
            ) : (
              filteredComments.map((comment) => {
                const targetPageSlot =
                  comment.pageIndex !== 'all'
                    ? pages.find((p) => p.index === comment.pageIndex)
                    : null;

                const hasReplies = comment.replies && comment.replies.length > 0;
                const isReplyingThis = replyingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      comment.resolved
                        ? 'bg-dark-850/50 border-emerald-500/25'
                        : 'bg-dark-800/80 border-dark-700/80'
                    }`}
                  >
                    {/* Comment Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${
                            comment.pageIndex === 'all'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                              : 'bg-gold-400/10 text-gold-400 border-gold-400/25'
                          }`}
                        >
                          {comment.pageIndex === 'all'
                            ? 'Global'
                            : `Page ${comment.pageIndex}${targetPageSlot ? ` • ${targetPageSlot.label}` : ''}`}
                        </span>

                        <span className="text-xs font-semibold text-dark-100">
                          {comment.author}
                        </span>

                        <span className="text-[10px] text-dark-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Status & Actions depending on role */}
                      <div className="flex items-center gap-1.5">
                        {isClientMode ? (
                          /* Client View: READ-ONLY STATUS BADGE (No delete, no resolve button) */
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 border ${
                              comment.resolved
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                : 'bg-dark-750 text-dark-400 border-dark-700'
                            }`}
                          >
                            {comment.resolved ? (
                              <>
                                <CheckCheck className="w-3 h-3 text-emerald-400" />
                                <span>Traité par le studio</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-dark-400" />
                                <span>En cours d'examen</span>
                              </>
                            )}
                          </span>
                        ) : (
                          /* Studio View: CAN VALIDATE & CAN DELETE */
                          <>
                            {onToggleResolveComment && (
                              <button
                                type="button"
                                onClick={() => onToggleResolveComment(comment.id)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors border ${
                                  comment.resolved
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                    : 'text-dark-300 hover:text-emerald-400 bg-dark-750 hover:bg-emerald-500/10 border-dark-700'
                                }`}
                                title={comment.resolved ? 'Marquer comme non résolu' : 'Valider la correction comme effectuée'}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{comment.resolved ? 'Corrigé ✓' : 'Valider correction'}</span>
                              </button>
                            )}

                            {onDeleteComment && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Supprimer cette remarque ?')) {
                                    onDeleteComment(comment.id);
                                  }
                                }}
                                className="p-1 rounded-md text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Supprimer la remarque"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Comment Body */}
                    <p className="text-xs text-dark-100 whitespace-pre-wrap pl-1 leading-relaxed">
                      {comment.text}
                    </p>

                    {/* Replies Thread */}
                    {hasReplies && (
                      <div className="mt-2.5 pt-2 border-t border-dark-750/70 space-y-1.5 pl-3">
                        {comment.replies!.map((reply) => (
                          <div
                            key={reply.id}
                            className="p-2 rounded-lg bg-dark-850/80 border border-dark-750 text-xs flex items-start gap-2"
                          >
                            <CornerDownRight className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-bold text-gold-400">
                                  {reply.author}
                                </span>
                                <span className="text-[10px] text-dark-500 font-mono">
                                  {new Date(reply.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-dark-200 text-xs leading-relaxed">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Studio Reply Action */}
                    {!isClientMode && onAddReply && (
                      <div className="mt-2 pt-1 flex justify-end">
                        {!isReplyingThis ? (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingCommentId(comment.id);
                              setReplyText('');
                            }}
                            className="text-[11px] font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-gold-400/10"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>Répondre au client</span>
                          </button>
                        ) : (
                          <div className="w-full mt-2 p-2.5 rounded-xl bg-dark-850 border border-dark-700/80 space-y-2">
                            <span className="text-[11px] font-bold text-gold-400 block">
                              Répondre au commentaire :
                            </span>
                            <textarea
                              rows={2}
                              autoFocus
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Ex: Correction effectuée sur le fichier, merci de vérifier..."
                              className="w-full bg-dark-900 border border-dark-700 text-xs p-2 rounded-lg text-dark-100 focus:outline-none focus:border-gold-400 resize-none"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setReplyingCommentId(null)}
                                className="px-2.5 py-1 text-xs text-dark-400 hover:text-dark-200"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyText.trim()}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-gold-400 hover:bg-gold-300 text-dark-950 disabled:opacity-40"
                              >
                                <Send className="w-3 h-3" />
                                <span>Envoyer la réponse</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
