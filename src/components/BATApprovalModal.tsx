import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  FileCheck,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Printer
} from 'lucide-react';
import { BookSettings, FORMAT_DIMENSIONS, BATApproval } from '../types';

interface BATApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BookSettings;
  batApproval: BATApproval | null;
  onSaveBAT: (approval: BATApproval) => void;
}

export const BATApprovalModal: React.FC<BATApprovalModalProps> = ({
  isOpen,
  onClose,
  settings,
  batApproval,
  onSaveBAT,
}) => {
  const [clientName, setClientName] = useState(batApproval?.clientName || '');
  const [clientEmail, setClientEmail] = useState(batApproval?.clientEmail || '');
  const [company, setCompany] = useState(batApproval?.company || '');
  const [notes, setNotes] = useState(batApproval?.notes || '');
  const [hasAgreed, setHasAgreed] = useState(batApproval?.approved || false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formatInfo = FORMAT_DIMENSIONS[settings.format] || FORMAT_DIMENSIONS.a5;

  const finishName =
    settings.paperFinish === 'matte'
      ? 'Couché Mat (Soyeux sans reflet)'
      : settings.paperFinish === 'glossy'
      ? 'Couché Brillant (Reflets vifs haute lumière)'
      : settings.paperFinish === 'kraft'
      ? 'Papier Kraft Naturel (Écologique & brut)'
      : 'Papier Vergé / Canson (Texture lin & fibres)';

  const finishShort =
    settings.paperFinish === 'matte'
      ? 'Couché Mat'
      : settings.paperFinish === 'glossy'
      ? 'Couché Brillant'
      : settings.paperFinish === 'kraft'
      ? 'Kraft Naturel'
      : 'Papier Vergé';

  const weightDesc =
    settings.paperWeight === 120
      ? '120 g/m² (Souple - style brochure/magazine)'
      : settings.paperWeight === 250
      ? '250 g/m² (Semi-rigide - cartonné standard)'
      : '350 g/m² (Rigide de prestige - haute tenue)';

  const handleValidateBAT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Veuillez renseigner votre nom pour valider le Bon À Tirer.');
      return;
    }
    if (!hasAgreed) {
      alert('Veuillez cocher la case d’accord pour valider formellement le BAT.');
      return;
    }

    const ref = batApproval?.batReference || `BAT-${Date.now().toString(36).toUpperCase()}`;

    const newApproval: BATApproval = {
      approved: true,
      approvedAt: batApproval?.approvedAt || new Date().toISOString(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      company: company.trim(),
      format: settings.format,
      paperWeight: settings.paperWeight,
      paperFinish: settings.paperFinish,
      pageCount: settings.pageCount,
      notes: notes.trim(),
      batReference: ref,
    };

    onSaveBAT(newApproval);
  };

  const getBATCertificateText = () => {
    const dateStr = batApproval?.approvedAt
      ? new Date(batApproval.approvedAt).toLocaleString('fr-FR')
      : new Date().toLocaleString('fr-FR');

    return `=====================================================
            CERTIFICAT DE BON À TIRER (BAT)
                     MOCKZ STUDIO
=====================================================

RÉFÉRENCE BAT : ${batApproval?.batReference || 'BAT-PROD'}
DATE & HEURE  : ${dateStr}
STATUT        : BON POUR ACCORD (VALIDÉ)

--- IDENTITÉ CLIENT ---
Signataire : ${batApproval?.clientName || clientName || 'N/A'}
Société    : ${batApproval?.company || company || 'N/A'}
Email      : ${batApproval?.clientEmail || clientEmail || 'N/A'}

--- SPÉCIFICATIONS TECHNIQUES D'IMPRESSION ---
Format          : ${formatInfo.label}
Nombre de volets: ${settings.pageCount} pages (${Math.ceil(settings.pageCount / 2)} feuilles recto/verso)
Grammage papier : ${settings.paperWeight} g/m² (${weightDesc})
Finition papier : ${finishName}

--- REMARQUES / CONSIGNES ---
${batApproval?.notes || notes || 'Aucune remarque particulière.'}

=====================================================
Signature numérique : Validé en ligne via Mockz 3D Studio
Conforme aux spécifications transmises pour lancement en production.
=====================================================`;
  };

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(getBATCertificateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReceipt = () => {
    const element = document.createElement('a');
    const file = new Blob([getBATCertificateText()], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `BAT_${batApproval?.batReference || 'Validation'}_Mockz.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="bg-dark-900 border border-dark-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-dark-700/60 flex items-center justify-between bg-dark-900">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              batApproval?.approved
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-gold-400/10 text-gold-400 border-gold-400/20'
            }`}>
              {batApproval?.approved ? (
                <FileCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Printer className="w-5 h-5 text-gold-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-dark-50 flex items-center gap-2">
                <span>Validation du Bon À Tirer (BAT)</span>
                {batApproval?.approved && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    Validé
                  </span>
                )}
              </h3>
              <p className="text-xs text-dark-400">
                Validation formelle pour lancement de l'impression physique
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Specifications Recap Box */}
          <div className="bg-dark-850/80 rounded-xl p-4 border border-dark-700/70">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                Spécifications d'impression sélectionnées
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-dark-800/80 border border-dark-700/50">
                <span className="text-[11px] text-dark-400 block mb-0.5">Format du support</span>
                <span className="font-bold text-dark-100">{formatInfo.label}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-dark-800/80 border border-dark-700/50">
                <span className="text-[11px] text-dark-400 block mb-0.5">Nombre de volets</span>
                <span className="font-bold text-dark-100">
                  {settings.pageCount} pages ({Math.ceil(settings.pageCount / 2)} feuilles)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-dark-800/80 border border-dark-700/50">
                <span className="text-[11px] text-dark-400 block mb-0.5">Papier &amp; Grammage</span>
                <span className="font-bold text-gold-400 font-mono">
                  {settings.paperWeight} g/m²
                </span>
                <span className="text-[11px] text-dark-300 block mt-0.5">{weightDesc}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-dark-800/80 border border-dark-700/50">
                <span className="text-[11px] text-dark-400 block mb-0.5">Finition de surface</span>
                <span className="font-bold text-dark-100">{finishShort}</span>
                <span className="text-[11px] text-dark-300 block mt-0.5">{finishName}</span>
              </div>
            </div>
          </div>

          {batApproval?.approved ? (
            /* Approved State Certificate */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">
                    Bon Pour Accord Enregistré avec succès !
                  </h4>
                  <p className="text-xs text-dark-300 mt-1">
                    Signé par <strong className="text-dark-100">{batApproval.clientName}</strong>{' '}
                    {batApproval.company && `(${batApproval.company}) `}le{' '}
                    {new Date(batApproval.approvedAt).toLocaleString('fr-FR')}.
                  </p>
                  <p className="text-[11px] text-dark-400 mt-1 font-mono">
                    Réf : {batApproval.batReference}
                  </p>
                </div>
              </div>

              {/* Actions for certified BAT */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-dark-800 hover:bg-dark-750 text-dark-100 border border-dark-700/80 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Récépissé copié !' : 'Copier le Bon Pour Accord'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gold-400 hover:bg-gold-300 text-dark-950 transition-all shadow-md shadow-gold-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le récépissé (.txt)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Approval Form */
            <form onSubmit={handleValidateBAT} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark-300 block mb-1">
                    Nom &amp; Prénom du signataire <span className="text-gold-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Sophie Martin"
                    className="w-full bg-dark-800 border border-dark-700/80 rounded-xl px-3 py-2 text-xs text-dark-100 focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-dark-300 block mb-1">
                    Entreprise / Organisation
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Studio ABC"
                    className="w-full bg-dark-800 border border-dark-700/80 rounded-xl px-3 py-2 text-xs text-dark-100 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-dark-300 block mb-1">
                  Adresse e-mail (pour confirmation)
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="sophie@exemple.com"
                  className="w-full bg-dark-800 border border-dark-700/80 rounded-xl px-3 py-2 text-xs text-dark-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-dark-300 block mb-1">
                  Remarques ou instructions d'impression (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Tirage en 500 exemplaires avec coins arrondis..."
                  className="w-full bg-dark-800 border border-dark-700/80 rounded-xl px-3 py-2 text-xs text-dark-100 focus:outline-none focus:border-gold-400 resize-none"
                />
              </div>

              {/* Legal Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-dark-850/60 border border-dark-750 cursor-pointer hover:bg-dark-800/80 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-dark-600 text-gold-400 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px] leading-relaxed text-dark-300">
                  <strong className="text-dark-100 font-semibold">
                    Bon pour accord définitif (BAT) :
                  </strong>{' '}
                  Je certifie avoir examiné attentivement la maquette 3D, les textes, les visuels
                  et les finitions choisies. Cette validation autorise le lancement de la fabrication.
                </span>
              </label>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-dark-750 text-dark-300 transition-colors"
                >
                  Continuer la relecture
                </button>

                <button
                  type="submit"
                  disabled={!hasAgreed || !clientName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-dark-950 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Signer &amp; Valider le BAT</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
