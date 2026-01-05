import React, { useState } from 'react';
import { X, Trash2, Edit2, Book, Layers } from 'lucide-react';
import { Subject, Chapter } from '../../types';

interface ManageContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  chapters: Chapter[];
  onEditSubject: (id: string, updates: Partial<Subject>) => void;
  onEditChapter: (id: string, title: string) => void;
  onDeleteSubjects: (ids: string[]) => void;
  onDeleteChapters: (ids: string[]) => void;
}

const ManageContentModal: React.FC<ManageContentModalProps> = ({
  isOpen,
  onClose,
  subjects,
  chapters,
  onEditSubject,
  onEditChapter,
  onDeleteSubjects,
  onDeleteChapters
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'notebooks' | 'chapters'>('notebooks');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter out summary notebooks for display. 
  // The delete logic in useNotebook already handles removing the paired summary when the main one is deleted.
  const displaySubjects = subjects.filter(s => !s.isSummary);

  const handleCheckbox = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    
    if (activeTab === 'notebooks') {
        onDeleteSubjects(Array.from(selectedIds));
    } else {
        onDeleteChapters(Array.from(selectedIds));
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 rounded-t-[2.5rem]">
           <div>
             <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manage Content</h3>
             <p className="text-sm text-slate-500 mt-1 font-medium">Edit details or delete items in bulk</p>
           </div>
           <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6 pb-2">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md">
                <button 
                    onClick={() => { setActiveTab('notebooks'); setSelectedIds(new Set()); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'notebooks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Book className="w-4 h-4" /> Notebooks
                </button>
                <button 
                    onClick={() => { setActiveTab('chapters'); setSelectedIds(new Set()); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'chapters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layers className="w-4 h-4" /> Chapters
                </button>
            </div>
        </div>
        
        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-3 bg-white">
          {activeTab === 'notebooks' ? (
              displaySubjects.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">No notebooks found.</div>
              ) : (
                  displaySubjects.map(sub => (
                    <div key={sub.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all group">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.has(sub.id)}
                            onChange={() => handleCheckbox(sub.id)}
                            className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1 grid grid-cols-12 gap-4">
                             <div className="col-span-6">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Title</label>
                                 <input 
                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-slate-900 font-bold transition-colors py-1"
                                    value={sub.title}
                                    onChange={(e) => onEditSubject(sub.id, { title: e.target.value })}
                                 />
                             </div>
                             <div className="col-span-3">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Term</label>
                                 <input 
                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-slate-600 text-sm font-medium transition-colors py-1"
                                    value={sub.term}
                                    onChange={(e) => onEditSubject(sub.id, { term: e.target.value })}
                                 />
                             </div>
                             <div className="col-span-3">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Year</label>
                                 <input 
                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-slate-600 text-sm font-medium transition-colors py-1"
                                    value={sub.year}
                                    onChange={(e) => onEditSubject(sub.id, { year: e.target.value })}
                                 />
                             </div>
                        </div>
                    </div>
                  ))
              )
          ) : (
            chapters.length === 0 ? (
                <div className="text-center py-20 text-slate-400">No chapters found.</div>
            ) : (
                displaySubjects.map(sub => {
                    const subChapters = chapters.filter(c => c.subjectId === sub.id);
                    if (subChapters.length === 0) return null;
                    return (
                        <div key={sub.id} className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">{sub.title}</h4>
                            <div className="space-y-2">
                                {subChapters.map(chap => (
                                    <div key={chap.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(chap.id)}
                                            onChange={() => handleCheckbox(chap.id)}
                                            className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <input 
                                                className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-slate-900 font-bold transition-colors py-1"
                                                value={chap.title}
                                                onChange={(e) => onEditChapter(chap.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/50 rounded-b-[2.5rem] flex justify-between items-center">
             <div className="text-sm text-slate-500 font-medium">
                 {selectedIds.size > 0 ? `${selectedIds.size} items selected` : 'Select items to delete'}
             </div>
             {selectedIds.size > 0 && (
                 <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all animate-fade-in"
                 >
                     <Trash2 className="w-4 h-4" />
                     Delete Selected
                 </button>
             )}
        </div>

      </div>
    </div>
  );
};

export default ManageContentModal;