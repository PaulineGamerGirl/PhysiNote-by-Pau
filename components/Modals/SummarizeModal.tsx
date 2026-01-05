import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Zap, Layers } from 'lucide-react';
import { Chapter } from '../../types';

interface SummarizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onSummarize: (chapterIds: string[]) => void;
}

const SummarizeModal: React.FC<SummarizeModalProps> = ({ isOpen, onClose, chapters, onSummarize }) => {
  if (!isOpen) return null;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auto-select all chapters by default on open
  useEffect(() => {
      if(isOpen && chapters.length > 0) {
          setSelectedIds(new Set(chapters.map(c => c.id)));
      }
  }, [isOpen, chapters]);

  const toggleChapter = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 transform transition-all scale-100">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
               <div className="bg-amber-100 text-amber-600 p-2 rounded-xl">
                   <Zap className="w-5 h-5" />
               </div>
               Summarize Notes
           </h3>
           <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition">
             <X className="w-5 h-5" />
           </button>
         </div>
         
         <p className="text-sm text-slate-500 mb-6 font-medium">
             Select the chapters you want to compress into the Summary Deck. The AI will distill each subtopic into concepts and math-only solutions.
         </p>

         <div className="space-y-3 max-h-[40vh] overflow-y-auto mb-8 pr-2">
            {chapters.length === 0 ? (
                <div className="text-center text-slate-400 py-4">No chapters found.</div>
            ) : (
                chapters.map(chap => (
                    <div 
                        key={chap.id}
                        onClick={() => toggleChapter(chap.id)} 
                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedIds.has(chap.id) ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                         <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${selectedIds.has(chap.id) ? 'bg-amber-500 border-amber-500' : 'bg-white border-slate-300'}`}>
                             {selectedIds.has(chap.id) && <CheckSquare className="w-4 h-4 text-white" />}
                         </div>
                         <span className={`font-bold ${selectedIds.has(chap.id) ? 'text-slate-900' : 'text-slate-600'}`}>{chap.title}</span>
                    </div>
                ))
            )}
         </div>

         <button 
            onClick={() => {
                onSummarize(Array.from(selectedIds));
                onClose();
            }}
            disabled={selectedIds.size === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-4 rounded-full font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
            <Zap className="w-4 h-4 fill-current" />
            <span>Generate Summaries</span>
        </button>
      </div>
    </div>
  );
};

export default SummarizeModal;