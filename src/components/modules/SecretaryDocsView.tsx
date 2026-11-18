import React, { useEffect, useState } from 'react';
import { Download, FileText, Languages, Plus, Printer, Trash2, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { LanguageCode, OfficialDocTemplateType, OfficialDocument, SecretaryEntry } from '../../types/erp';
import { generateDocumentDraft, getTemplateTitle, LANGUAGE_LABELS, translateDocumentText } from '../../utils/i18n';
import { formatCorporateDate } from '../../utils/ethiopianCalendar';
import { SevenSundayLogo, ORIGINAL_SEVEN_SUNDAY_LOGO_PATH } from '../common/SevenSundayLogo';
import { QrCodeCanvas } from '../common/QrCodeCanvas';

const TEMPLATES: OfficialDocTemplateType[] = [
  'Employee Letter',
  'Employment Contract',
  'Salary Certificate',
  'Warning Letter',
  'Sales Invoice',
  'Payment Receipt',
  'Purchase Order',
  'Delivery Note',
  'Company Report',
  'Payment Voucher',
  'Receipt Voucher',
  'Material Issue Voucher',
  'Goods Receiving Note',
  'Stock Transfer Form',
  'Maintenance Form',
  'Time Tracking Attendance Form',
  'Audit Report',
  'Quotation Document',
  'Customer Statement',
  'Supplier Statement',
];

interface SecretaryDocsViewProps {
  initialView?: 'secretary' | 'documents';
  focusedDocId?: string;
  onClearFocus?: () => void;
}

export const SecretaryDocsView: React.FC<SecretaryDocsViewProps> = ({
  initialView = 'documents',
  focusedDocId,
  onClearFocus,
}) => {
  const { state, currentUser, mutate } = useErp();
  const [viewMode, setViewMode] = useState<'secretary' | 'documents'>(initialView);
  const [previewDoc, setPreviewDoc] = useState<OfficialDocument | null>(null);
  const [showDocEditor, setShowDocEditor] = useState(false);

  useEffect(() => {
    if (!focusedDocId || !state) return;
    const match = state.officialDocuments.find((d) => d.id === focusedDocId);
    if (match) {
      setViewMode('documents');
      setPreviewDoc(match);
    }
    onClearFocus?.();
  }, [focusedDocId, onClearFocus, state]);

  // Secretary Log Form
  const [secForm, setSecForm] = useState({
    direction: 'Incoming' as SecretaryEntry['direction'],
    subject: '',
    counterparty: '',
    department: 'Secretary Department',
    assignedTo: 'Selamawit Girma',
    priority: 'Normal' as SecretaryEntry['priority'],
    summary: '',
  });

  // Official Document Form
  const [docForm, setDocForm] = useState<{
    templateType: OfficialDocTemplateType;
    recipientName: string;
    department: string;
    language: LanguageCode;
    bilingualPair: LanguageCode;
    subject: string;
    bodyText: string;
    translatedBodyText: string;
    amount: number;
  }>(() => {
    const draft = generateDocumentDraft('Employee Letter', 'en', 'Staff Member', 'Secretary Department');
    return {
      templateType: 'Employee Letter',
      recipientName: 'Abebe Kebede',
      department: 'Secretary Department',
      language: 'en',
      bilingualPair: 'am',
      subject: draft.subject,
      bodyText: draft.body,
      translatedBodyText: translateDocumentText(draft.body, 'en', 'am', 'Employee Letter', 'Abebe Kebede', 'Secretary Department'),
      amount: 0,
    };
  });

  if (!state) return null;

  const handleLoadTemplateDraft = (template: OfficialDocTemplateType, lang: LanguageCode, targetLang: LanguageCode) => {
    const draft = generateDocumentDraft(template, lang, docForm.recipientName, docForm.department, docForm.amount);
    const trans = translateDocumentText(
      draft.body,
      lang,
      targetLang,
      template,
      docForm.recipientName,
      docForm.department,
      docForm.amount
    );
    setDocForm((prev) => ({
      ...prev,
      templateType: template,
      language: lang,
      bilingualPair: targetLang,
      subject: draft.subject,
      bodyText: draft.body,
      translatedBodyText: trans,
    }));
  };

  const handleTranslateNow = () => {
    const trans = translateDocumentText(
      docForm.bodyText,
      docForm.language,
      docForm.bilingualPair,
      docForm.templateType,
      docForm.recipientName,
      docForm.department,
      docForm.amount
    );
    setDocForm((prev) => ({ ...prev, translatedBodyText: trans }));
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `doc_${Date.now()}`;
    const docNum = `SSE-${docForm.templateType
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()}-${String(state.officialDocuments.length + 1).padStart(4, '0')}`;

    const record: OfficialDocument = {
      id,
      docNumber: docNum,
      templateType: docForm.templateType,
      title: getTemplateTitle(docForm.templateType, docForm.language),
      recipientName: docForm.recipientName,
      department: docForm.department,
      language: docForm.language,
      bilingualPair: docForm.bilingualPair,
      subject: docForm.subject,
      bodyText: docForm.bodyText,
      translatedBodyText: docForm.translatedBodyText,
      amount: docForm.amount > 0 ? docForm.amount : undefined,
      currency: state.companySettings.defaultCurrency,
      issuedBy: currentUser?.fullName || 'Secretary',
      date: new Date().toISOString().slice(0, 10),
      status: 'Issued',
      version: 1,
    };

    await mutate('officialDocuments', 'create', id, record);
    setPreviewDoc(record);
    setShowDocEditor(false);
  };

  const handleDownloadHtmlDoc = (doc: OfficialDocument) => {
    const logoSrc = state.companySettings.customLogoDataUrl || `${window.location.origin}${ORIGINAL_SEVEN_SUNDAY_LOGO_PATH}`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${doc.docNumber}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#15243A;max-width:820px;margin:auto}h1{color:#082B59;font-size:18px;margin:0}pre{white-space:pre-wrap;font-family:inherit;line-height:1.6}</style></head><body><img src="${logoSrc}" alt="Seven Sunday Logo" style="height:48px;width:auto;object-fit:contain;margin-bottom:8px"/><h1>${state.companySettings.companyName}</h1><p>${state.companySettings.address} · Tel: ${state.companySettings.phone} · TIN: ${state.companySettings.tinNumber}</p><hr/><h2>${doc.title} (${doc.docNumber})</h2><p><strong>Date:</strong> ${doc.date} | <strong>Recipient:</strong> ${doc.recipientName} | <strong>Department:</strong> ${doc.department}</p><pre>${doc.bodyText}</pre>${doc.translatedBodyText ? `<hr/><h3>Translation (${LANGUAGE_LABELS[doc.bilingualPair || 'am']})</h3><pre>${doc.translatedBodyText}</pre>` : ''}<hr/><p><small>Issued by: ${doc.issuedBy} · Verified Digital Document</small></p></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.docNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSecretary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secForm.subject) return;
    const id = `sec_${Date.now()}`;
    const rec: SecretaryEntry = {
      id,
      refNumber: `SEC-${secForm.direction.slice(0, 3).toUpperCase()}-2026-${String(state.secretaryEntries.length + 1).padStart(3, '0')}`,
      direction: secForm.direction,
      subject: secForm.subject,
      counterparty: secForm.counterparty,
      department: secForm.department,
      assignedTo: secForm.assignedTo,
      priority: secForm.priority,
      status: 'Received',
      date: new Date().toISOString().slice(0, 10),
      summary: secForm.summary,
      version: 1,
    };
    await mutate('secretaryEntries', 'create', id, rec);
    setSecForm({ ...secForm, subject: '', counterparty: '', summary: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Secretary Department & Official Company Documents
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official letters, contracts, vouchers, forms, and 4-language exchange (Amharic ↔ English ↔ Chinese ↔ Afaan Oromiffa)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('documents')}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                viewMode === 'documents' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Official Document Generator
            </button>
            <button
              type="button"
              onClick={() => setViewMode('secretary')}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                viewMode === 'secretary' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Secretary Correspondence Desk
            </button>
          </div>
          {viewMode === 'documents' && (
            <button
              type="button"
              onClick={() => setShowDocEditor(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Official Document
            </button>
          )}
        </div>
      </div>

      {viewMode === 'secretary' && (
        <div className="space-y-5 no-print">
          <form onSubmit={handleSaveSecretary} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <select value={secForm.direction} onChange={(e) => setSecForm({ ...secForm, direction: e.target.value as SecretaryEntry['direction'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Incoming">Incoming Correspondence</option>
              <option value="Outgoing">Outgoing Official Letter</option>
              <option value="Internal Memo">Internal Memo</option>
              <option value="Meeting Minutes">Executive Meeting Minutes</option>
            </select>
            <input type="text" required placeholder="Letter / Memo Subject *" value={secForm.subject} onChange={(e) => setSecForm({ ...secForm, subject: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="External Organization / Recipient" value={secForm.counterparty} onChange={(e) => setSecForm({ ...secForm, counterparty: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <select value={secForm.department} onChange={(e) => setSecForm({ ...secForm, department: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              {state.departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <select value={secForm.priority} onChange={(e) => setSecForm({ ...secForm, priority: e.target.value as SecretaryEntry['priority'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Normal">Normal Priority</option>
              <option value="Urgent">Urgent</option>
              <option value="Confidential">Confidential</option>
            </select>
            <input type="text" placeholder="Assigned Staff Member" value={secForm.assignedTo} onChange={(e) => setSecForm({ ...secForm, assignedTo: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <textarea placeholder="Correspondence summary or action required..." value={secForm.summary} onChange={(e) => setSecForm({ ...secForm, summary: e.target.value })} rows={2} className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white font-medium cursor-pointer">
              Log Secretary Entry
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ref #</th>
                  <th className="px-4 py-3 font-semibold">Type & Subject</th>
                  <th className="px-4 py-3 font-semibold">Counterparty</th>
                  <th className="px-4 py-3 font-semibold">Assigned To</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.secretaryEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{entry.refNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#15243A] dark:text-white">{entry.subject}</div>
                      <div className="text-slate-500">{entry.direction} · {entry.priority} · {entry.date}</div>
                    </td>
                    <td className="px-4 py-3">{entry.counterparty || 'Internal'}</td>
                    <td className="px-4 py-3">{entry.assignedTo}</td>
                    <td className="px-4 py-3">
                      <select
                        value={entry.status}
                        onChange={(e) => void mutate('secretaryEntries', 'update', entry.id, { status: e.target.value }, entry.version)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                      >
                        <option value="Received">Received</option>
                        <option value="In Review">In Review</option>
                        <option value="Responded">Responded</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => void mutate('secretaryEntries', 'delete', entry.id, {})} className="p-1 text-slate-400 hover:text-red-600 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {state.secretaryEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No secretary correspondence entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'documents' && (
        <div className="space-y-5">
          {showDocEditor && (
            <form onSubmit={handleSaveDocument} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 no-print">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#15243A] dark:text-white">
                  <Languages className="w-4 h-4 text-[#087CEB]" />
                  <span>Official Document & 4-Language Translation Composer</span>
                </div>
                <button type="button" onClick={() => setShowDocEditor(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Template (20 Official Formats)</label>
                  <select
                    value={docForm.templateType}
                    onChange={(e) => handleLoadTemplateDraft(e.target.value as OfficialDocTemplateType, docForm.language, docForm.bilingualPair)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    {TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Primary Language</label>
                  <select
                    value={docForm.language}
                    onChange={(e) => handleLoadTemplateDraft(docForm.templateType, e.target.value as LanguageCode, docForm.bilingualPair)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    {Object.entries(LANGUAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Exchange / Translate To</label>
                  <select
                    value={docForm.bilingualPair}
                    onChange={(e) => {
                      const target = e.target.value as LanguageCode;
                      setDocForm((prev) => ({
                        ...prev,
                        bilingualPair: target,
                        translatedBodyText: translateDocumentText(prev.bodyText, prev.language, target, prev.templateType, prev.recipientName, prev.department, prev.amount),
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    {Object.entries(LANGUAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Recipient / Staff / Party</label>
                  <input
                    type="text"
                    required
                    value={docForm.recipientName}
                    onChange={(e) => setDocForm({ ...docForm, recipientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Amount ({state.companySettings.defaultCurrency})</label>
                  <input
                    type="number"
                    value={docForm.amount}
                    onChange={(e) => setDocForm({ ...docForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#15243A] dark:text-white">
                      Primary Content ({LANGUAGE_LABELS[docForm.language]})
                    </span>
                    <button type="button" onClick={handleTranslateNow} className="text-[#087CEB] hover:underline cursor-pointer">
                      Convert to {LANGUAGE_LABELS[docForm.bilingualPair]} →
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={docForm.bodyText}
                    onChange={(e) => setDocForm({ ...docForm, bodyText: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 leading-relaxed"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#15243A] dark:text-white">
                      Translated Exchange ({LANGUAGE_LABELS[docForm.bilingualPair]})
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={docForm.translatedBodyText}
                    onChange={(e) => setDocForm({ ...docForm, translatedBodyText: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F5F8FC] dark:bg-slate-950 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowDocEditor(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
                  Close
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white text-xs font-medium cursor-pointer">
                  Issue Official Document
                </button>
              </div>
            </form>
          )}

          {/* Issued Documents Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-print">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Document #</th>
                  <th className="px-4 py-3 font-semibold">Template & Recipient</th>
                  <th className="px-4 py-3 font-semibold">Languages</th>
                  <th className="px-4 py-3 font-semibold">Issued Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.officialDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{doc.docNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#15243A] dark:text-white">{doc.templateType}</div>
                      <div className="text-slate-500">To: {doc.recipientName} · {doc.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      {LANGUAGE_LABELS[doc.language]} {doc.bilingualPair ? `↔ ${LANGUAGE_LABELS[doc.bilingualPair]}` : ''}
                    </td>
                    <td className="px-4 py-3 font-mono">{doc.date}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-[#087CEB]" /> View & Print
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadHtmlDoc(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                      <button
                        type="button"
                        onClick={() => void mutate('officialDocuments', 'delete', doc.id, {})}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {state.officialDocuments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      No official documents generated yet. Click "New Official Document" to generate bilingual corporate letters, contracts, or vouchers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Letterhead Print / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white text-[#15243A] rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-8 print-surface">
            <div className="flex items-center justify-between no-print border-b border-slate-200 pb-3">
              <span className="text-xs font-semibold text-slate-500">Official Letterhead Preview — {previewDoc.docNumber}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleDownloadHtmlDoc(previewDoc)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1178B9] text-white text-xs font-medium cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button type="button" onClick={() => setPreviewDoc(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs cursor-pointer">
                  Close
                </button>
              </div>
            </div>

            {/* Letterhead Header */}
            <div className="flex items-start justify-between border-b-2 border-[#082B59] pb-4">
              <div className="flex items-center gap-4">
                <SevenSundayLogo customLogoUrl={state.companySettings.customLogoDataUrl} size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-[#082B59]">{state.companySettings.companyName}</h2>
                  <p className="text-xs text-[#1178B9] font-medium">{state.companySettings.slogan}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {state.companySettings.address} · Tel: {state.companySettings.phone} · TIN: {state.companySettings.tinNumber}
                  </p>
                </div>
              </div>
              <QrCodeCanvas value={`SSE-DOC|${previewDoc.docNumber}|${previewDoc.date}|${previewDoc.recipientName}`} size={72} />
            </div>

            {/* Document Metadata */}
            <div className="flex flex-wrap justify-between gap-4 text-xs bg-[#F5F8FC] p-3 rounded-lg border border-slate-200">
              <div>
                <div className="font-bold text-sm text-[#082B59]">{previewDoc.title}</div>
                <div>Recipient: <strong>{previewDoc.recipientName}</strong></div>
                <div>Department: {previewDoc.department}</div>
              </div>
              <div className="text-right font-mono">
                <div>Ref: <strong>{previewDoc.docNumber}</strong></div>
                <div>Date: {formatCorporateDate(previewDoc.date, state.companySettings.calendarSystem, previewDoc.language)}</div>
              </div>
            </div>

            {/* Primary & Translated Bodies */}
            <div className="space-y-5 text-sm leading-relaxed">
              <pre className="whitespace-pre-wrap font-sans">{previewDoc.bodyText}</pre>
              {previewDoc.translatedBodyText && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-xs font-semibold text-[#087CEB] mb-2">
                    {LANGUAGE_LABELS[previewDoc.bilingualPair || 'am']} Translation
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-slate-700">{previewDoc.translatedBodyText}</pre>
                </div>
              )}
            </div>

            {/* Signature & Stamp Footer */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
              <div>
                <div className="font-semibold">Issued By: {previewDoc.issuedBy}</div>
                {state.companySettings.authorizedSignatureDataUrl ? (
                  <img src={state.companySettings.authorizedSignatureDataUrl} alt="Authorized Signature" className="h-12 mt-2 object-contain" />
                ) : (
                  <div className="mt-6 w-44 border-t border-slate-400 pt-1 text-slate-500">Authorized Signature</div>
                )}
              </div>
              <div className="text-center">
                {state.companySettings.companyStampDataUrl ? (
                  <img src={state.companySettings.companyStampDataUrl} alt="Company Stamp" className="h-16 mx-auto object-contain" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#082B59]/40 flex items-center justify-center text-[10px] text-[#082B59]/60 font-semibold">
                    OFFICIAL STAMP
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
