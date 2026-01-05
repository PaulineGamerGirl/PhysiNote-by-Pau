
import React, { useState } from 'react';
import { Archive, Save, Download, Upload, X, Edit3, FileText, Loader2 } from 'lucide-react';
import { Subject, Chapter, Note } from '../../types';
import { downloadNotebookPDF } from '../../services/pdfService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenManageContent: () => void;
  
  // Data for PDF Generation
  subjects: Subject[];
  chapters: Chapter[];
  notes: Note[];
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onExport, onImport, onOpenManageContent,
    subjects, chapters, notes
}) => {
  if (!isOpen) return null;

  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedPdfSubjectId, setSelectedPdfSubjectId] = useState<string>('');

  const displaySubjects = subjects.filter(s => !s.isSummary);

  const handleDownloadPdf = async () => {
      if (!selectedPdfSubjectId) return;

      setPdfLoading(true);
      try {
          // 1. Find Main Subject
          const mainSubject = subjects.find(s => s.id === selectedPdfSubjectId);
          if (mainSubject) {
              await downloadNotebookPDF(mainSubject, chapters, notes);
          }

          // 2. Find Summary Subject (if exists)
          const summarySubject = subjects.find(s => s.isSummary && s.originalSubjectId === selectedPdfSubjectId);
          if (summarySubject) {
              // Slight delay to ensure browsers handle multiple downloads
              setTimeout(async () => {
                  await downloadNotebookPDF(summarySubject, chapters, notes);
              }, 1000);
          }
      } catch (e) {
          console.error(e);
          alert("Failed to generate PDF");
      } finally {
          setPdfLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 transform transition-all scale-100 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Archive className="w-6 h-6 text-blue-600" />
                    Settings
                </h3>
                <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="space-y-6">
                
                {/* PDF Download Section */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-500" />
                        Download Notebook PDF
                    </h4>
                    <div className="space-y-3">
                        <select 
                            value={selectedPdfSubjectId}
                            onChange={(e) => setSelectedPdfSubjectId(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                        >
                            <option value="">Select a Notebook...</option>
                            {displaySubjects.map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                        </select>
                        
                        <button 
                            onClick={handleDownloadPdf}
                            disabled={!selectedPdfSubjectId || pdfLoading}
                            className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-200"
                        >
                            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {pdfLoading ? "Generating..." : "Download PDF Bundle"}
                        </button>
                        <p className="text-[10px] text-center text-slate-400">
                            Includes both Main Notebook and Summary Deck.
                        </p>
                    </div>
                </div>

                <div className="w-full h-px bg-slate-100"></div>
                
                <button 
                    onClick={() => { onClose(); onOpenManageContent(); }}
                    className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-slate-100 transition-colors group text-left relative overflow-hidden"
                >
                    <div className="relative z-10 flex items-center justify-between">
                         <div>
                            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-slate-500" />
                                Manage Content
                            </h4>
                            <p className="text-xs text-slate-500">Edit or delete notebooks & chapters</p>
                         </div>
                         <div className="bg-white p-2 rounded-full shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                            <Edit3 className="w-4 h-4" />
                         </div>
                    </div>
                </button>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Save className="w-4 h-4 text-emerald-500" />
                        Auto-Save Active
                    </h4>
                    <p className="text-sm text-slate-500">Your notes are automatically saved to this device's local storage.</p>
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Transfer Data</label>
                    <button 
                        onClick={onExport}
                        className="w-full py-4 rounded-2xl bg-white border-2 border-slate-100 text-slate-700 font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all group"
                    >
                        <Download className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>Export Archive (.json)</span>
                    </button>
                    
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".json"
                            onChange={onImport}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                            <Upload className="w-5 h-5" />
                            <span>Import Archive</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;
