import React from 'react';
import { X, Printer } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';
import { Chapter } from '../../types';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  selectedChapter: Chapter | null;
}

const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose, content, selectedChapter }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-4 print:static print:bg-white print:p-0">
        <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] print:max-h-none print:shadow-none print:w-full">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center print:hidden">
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Formula Cheat Sheet</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{selectedChapter?.title}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-700 bg-white border border-slate-200 px-5 py-2.5 rounded-full hover:bg-slate-50 transition shadow-sm font-bold text-sm">
                        <Printer className="w-4 h-4" />
                        Print / PDF
                    </button>
                    <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="overflow-y-auto p-12 print:overflow-visible">
                <MarkdownRenderer content={content} />
            </div>
        </div>
    </div>
  );
};

export default CheatSheetModal;