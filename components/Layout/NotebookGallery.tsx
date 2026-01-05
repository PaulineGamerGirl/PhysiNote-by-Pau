
import React, { useState } from 'react';
import { Plus, Filter, Image as ImageIcon, Check, Book, Zap } from 'lucide-react';
import { Subject } from '../../types';

interface NotebookGalleryProps {
  mode: 'NORMAL' | 'SUMMARY';
  setMode: (mode: 'NORMAL' | 'SUMMARY') => void;
  subjects: Subject[];
  onSelectSubject: (s: Subject) => void;
  onAddSubject: () => void;
  onUpdateCover: (id: string, url: string) => void;
}

const NotebookGallery: React.FC<NotebookGalleryProps> = ({ 
  mode,
  setMode,
  subjects, 
  onSelectSubject, 
  onAddSubject,
  onUpdateCover
}) => {
  const [filterTerm, setFilterTerm] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, subjectId: string } | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Derived Terms/Years for Dropdown (Unique Combinations)
  const uniquePeriods = Array.from(new Set(subjects.map(s => `${s.term} • ${s.year}`))).filter(Boolean).sort();
  
  // Filter Logic
  const filteredSubjects = subjects.filter(s => {
      const modeMatch = mode === 'NORMAL' ? !s.isSummary : s.isSummary;
      const periodKey = `${s.term} • ${s.year}`;
      const termMatch = filterTerm === 'ALL' || periodKey === filterTerm;
      return modeMatch && termMatch;
  });

  const handleContextMenu = (e: React.MouseEvent, subjectId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, subjectId });
      setNewImageUrl('');
  };

  const handleSaveCover = () => {
      if (contextMenu && newImageUrl) {
          onUpdateCover(contextMenu.subjectId, newImageUrl);
      }
      setContextMenu(null);
  };

  const closeMenus = () => {
      setContextMenu(null);
      setIsFilterOpen(false);
  };

  return (
    <div className="pt-6 pb-20 animate-fade-in min-h-[80vh]" onClick={closeMenus}>
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
           <div className="w-full md:w-auto">
               <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">
                   {mode === 'NORMAL' ? 'My Library' : 'Summary Decks'}
               </h1>
               <p className="text-slate-400 font-medium text-lg">
                   {mode === 'NORMAL' ? 'Your collection of notes.' : 'Distilled cheat sheets.'}
               </p>
           </div>

           <div className="flex items-center gap-4 w-full md:w-auto">
               {/* Mode Toggle Pill */}
                <div className="bg-slate-100 p-1 rounded-full flex relative">
                    <button 
                        onClick={() => setMode('NORMAL')}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${mode === 'NORMAL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Book className="w-4 h-4" />
                        <span>Notebooks</span>
                    </button>
                    <button 
                        onClick={() => setMode('SUMMARY')}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${mode === 'SUMMARY' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Zap className="w-4 h-4" />
                        <span>Summaries</span>
                    </button>
                </div>

               {/* Term/Year Filter */}
               <div className="relative z-20" onClick={(e) => e.stopPropagation()}>
                   <button 
                       onClick={() => setIsFilterOpen(!isFilterOpen)}
                       className={`flex items-center gap-2 bg-white px-5 py-3 rounded-full shadow-sm border cursor-pointer hover:border-pink-300 transition-all ${isFilterOpen ? 'border-pink-300 ring-2 ring-pink-100' : 'border-slate-200'}`}
                   >
                       <Filter className="w-4 h-4 text-slate-400" />
                       <span className="text-sm font-bold text-slate-600">{filterTerm === 'ALL' ? 'All Terms' : filterTerm}</span>
                   </button>
                   
                   {/* Dropdown */}
                   {isFilterOpen && (
                       <div className="absolute top-full right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 p-2 animate-slide-down origin-top-right z-30">
                           <button 
                                onClick={() => { setFilterTerm('ALL'); setIsFilterOpen(false); }} 
                                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-pink-50 hover:text-pink-600 rounded-xl transition-colors"
                           >
                               All Notebooks
                           </button>
                           {uniquePeriods.map(period => (
                               <button 
                                    key={period} 
                                    onClick={() => { setFilterTerm(period); setIsFilterOpen(false); }} 
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-pink-50 hover:text-pink-600 rounded-xl transition-colors"
                               >
                                   {period}
                               </button>
                           ))}
                       </div>
                   )}
               </div>
               
               {mode === 'NORMAL' && (
                <button onClick={onAddSubject} className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 hover:scale-105 transition-all flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">New Notebook</span>
                </button>
               )}
           </div>
       </div>

       {/* Grid */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
           {filteredSubjects.length === 0 && (
               <div className="col-span-full py-32 text-center text-slate-400 font-medium flex flex-col items-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Book className="w-8 h-8 opacity-20" />
                   </div>
                   {mode === 'NORMAL' ? 'No notebooks found.' : 'No summaries generated yet.'}
               </div>
           )}

           {filteredSubjects.map((sub, index) => (
               <div 
                  key={sub.id} 
                  onClick={(e) => { e.stopPropagation(); onSelectSubject(sub); }}
                  onContextMenu={(e) => handleContextMenu(e, sub.id)}
                  className="group relative cursor-pointer"
               >
                   {/* Cover Image Area - Thinner Aspect Ratio */}
                   <div className="aspect-[3/4] w-full bg-slate-100 rounded-[1.5rem] mb-4 overflow-hidden relative isolate shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                        {sub.coverImage?.startsWith('http') ? (
                                <img src={sub.coverImage} alt={sub.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                                <div className="w-full h-full" style={{ background: sub.coverImage || '#e2e8f0' }}></div>
                        )}
                        
                        {/* Glass overlay on hover */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Edit Icon Hint */}
                        <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-md p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImageIcon className="w-3 h-3" />
                        </div>
                   </div>

                   {/* Title Area - Minimal, Below Image */}
                   <div className="px-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1 group-hover:text-pink-600 transition-colors">{sub.title}</h3>
                                <p className="text-xs text-pink-400 font-semibold uppercase tracking-widest">{sub.term} • {sub.year}</p>
                            </div>
                            {mode === 'SUMMARY' && <Zap className="w-4 h-4 text-amber-400 mt-1" />}
                        </div>
                   </div>
               </div>
           ))}
       </div>

       {/* Context Menu for Changing Photo */}
       {contextMenu && (
           <div 
             className="fixed bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 w-80 border border-white/20 animate-scale-in z-50 ring-1 ring-black/5"
             style={{ top: contextMenu.y, left: contextMenu.x }}
             onClick={(e) => e.stopPropagation()}
           >
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <ImageIcon className="w-3 h-3" /> Change Cover Photo
               </h4>
               <div className="flex gap-2">
                   <input 
                      autoFocus
                      placeholder="Paste Image URL..." 
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-pink-200 font-medium"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveCover()}
                   />
                   <button onClick={handleSaveCover} className="bg-pink-500 text-white p-2.5 rounded-xl hover:bg-pink-600 transition">
                       <Check className="w-4 h-4" />
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};

export default NotebookGallery;
