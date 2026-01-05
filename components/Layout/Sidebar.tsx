
import React, { useState } from 'react';
import { Brain, Plus, ChevronRight, Book, List, Trash2, Edit2, Check, Layers, Zap, Grid, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Subject, Chapter, Note } from '../../types';

interface SidebarProps {
  isSidebarOpen: boolean;
  subjects: Subject[];
  chapters: Chapter[];
  notes: Note[];
  selectedSubject: Subject | null;
  selectedChapter: Chapter | null;
  selectedNote: Note | null;
  setSelectedSubject: (s: Subject | null) => void;
  setSelectedChapter: (c: Chapter | null) => void;
  setSelectedNote: (n: Note | null) => void;
  setIsCreateSubjectModalOpen: (isOpen: boolean) => void;
  setIsCreateChapterModalOpen: (isOpen: boolean) => void;
  setIsCreateNoteModalOpen: (isOpen: boolean) => void;
  handleDeleteChapter: (chapterId: string, e: React.MouseEvent) => void;
  handleDeleteNote: (noteId: string, e: React.MouseEvent) => void;
  handleEditChapter?: (id: string, title: string) => void;
  handleEditNote?: (id: string, title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  subjects,
  chapters,
  notes,
  selectedSubject,
  selectedChapter,
  selectedNote,
  setSelectedSubject,
  setSelectedChapter,
  setSelectedNote,
  setIsCreateSubjectModalOpen,
  setIsCreateChapterModalOpen,
  setIsCreateNoteModalOpen,
  handleDeleteChapter,
  handleDeleteNote,
  handleEditChapter,
  handleEditNote
}) => {
  // Editing State for Chapters
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');

  // Editing State for Notes (Subtopics)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');

  // --- Chapter Editing ---
  const startEditingChapter = (chapter: Chapter, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingChapterId(chapter.id);
      setEditChapterTitle(chapter.title);
      // Close note editing if open
      setEditingNoteId(null);
  };

  const saveEditingChapter = (chapterId: string) => {
      if (handleEditChapter && editChapterTitle.trim()) {
          handleEditChapter(chapterId, editChapterTitle);
      }
      setEditingChapterId(null);
  };

  // --- Note Editing ---
  const startEditingNote = (note: Note, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingNoteId(note.id);
      setEditNoteTitle(note.content.title);
      // Close chapter editing if open
      setEditingChapterId(null);
  };

  const saveEditingNote = (noteId: string) => {
      if (handleEditNote && editNoteTitle.trim()) {
          handleEditNote(noteId, editNoteTitle);
      }
      setEditingNoteId(null);
  };

  const goHome = () => {
      setSelectedSubject(null);
      setSelectedChapter(null);
      setSelectedNote(null);
  };

  const handleAddNoteToChapter = (chapter: Chapter, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedChapter(chapter);
      setIsCreateNoteModalOpen(true);
  };

  return (
    <div className={`fixed inset-y-0 left-0 bg-white/80 backdrop-blur-2xl border-r border-slate-200/50 w-80 transform transition-transform duration-500 ease-in-out z-20 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
      <div className="p-6 pb-2">
        {/* Navigation State */}
        {selectedSubject ? (
             <div className="animate-fade-in">
                 <button 
                    onClick={goHome} 
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-800 mb-6 transition-colors group px-1"
                 >
                     <div className="bg-slate-100 group-hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                     </div>
                     Back to Library
                 </button>
                 
                 <div className={`p-5 rounded-[1.2rem] shadow-sm border ${selectedSubject.isSummary ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100' : 'bg-gradient-to-br from-white to-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        {selectedSubject.isSummary ? <Zap className="w-4 h-4 text-amber-500" /> : <Book className="w-4 h-4 text-blue-500" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Notebook</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight mb-1">{selectedSubject.title}</h3>
                    <p className="text-xs text-slate-500 font-bold">{selectedSubject.term} • {selectedSubject.year}</p>
                 </div>
             </div>
        ) : (
            // This state essentially won't be visible due to App.tsx hiding Sidebar on home, but kept for safety
            <div className="flex items-center gap-3 text-slate-900 mb-8 cursor-pointer" onClick={goHome}>
                <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg shadow-slate-200">
                    <Brain className="w-6 h-6" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight">PhysiNote</span>
            </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 no-scrollbar">
        {selectedSubject && (
            <>
                <div className="flex justify-between items-center mb-4 mt-4 px-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chapters</h3>
                    {!selectedSubject.isSummary && (
                        <button onClick={() => setIsCreateChapterModalOpen(true)} className="bg-white hover:bg-blue-50 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shadow-sm border border-slate-100"><Plus className="w-3.5 h-3.5" /></button>
                    )}
                </div>
                
                {chapters.filter(c => c.subjectId === selectedSubject.id).map(chapter => (
                <div key={chapter.id} className="mb-2">
                    <div 
                        onClick={() => { if(editingChapterId !== chapter.id) setSelectedChapter(chapter); }}
                        className={`px-3 py-3 rounded-xl cursor-pointer flex items-center justify-between group transition-all duration-200 ${selectedChapter?.id === chapter.id ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        {editingChapterId === chapter.id ? (
                            <div className="flex items-center gap-2 w-full">
                                <input 
                                    value={editChapterTitle} 
                                    onChange={(e) => setEditChapterTitle(e.target.value)}
                                    className="bg-white border-2 border-blue-500 rounded-lg px-2 py-1 text-sm w-full outline-none"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && saveEditingChapter(chapter.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button onClick={(e) => { e.stopPropagation(); saveEditingChapter(chapter.id); }} className="text-blue-600 hover:bg-blue-100 p-1 rounded-md">
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <div className={`w-1 h-4 rounded-full flex-shrink-0 ${selectedChapter?.id === chapter.id ? 'bg-slate-900' : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
                                    <span className="text-sm font-bold truncate">{chapter.title}</span>
                                </div>
                                {!selectedSubject.isSummary && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleAddNoteToChapter(chapter, e)} 
                                            title="Add Subtopic"
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={(e) => startEditingChapter(chapter, e)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button onClick={(e) => handleDeleteChapter(chapter.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    {selectedChapter?.id === chapter.id && (
                        <div className="mt-2 mb-4 space-y-1 ml-4 pl-4 border-l border-slate-100 animate-slide-down">
                        <div 
                            onClick={() => { setSelectedNote(null); }}
                            className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2 transition-colors ${!selectedNote ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                            >
                            <List className="w-3.5 h-3.5" />
                            <span className="truncate">Chapter Overview</span>
                        </div>

                        {notes.filter(n => n.chapterId === chapter.id).map(note => (
                            <div 
                                key={note.id}
                                onClick={() => { if(editingNoteId !== note.id) setSelectedNote(note); }}
                                className={`px-3 py-2 text-xs font-medium rounded-lg cursor-pointer flex justify-between items-center group/note transition-colors ${selectedNote?.id === note.id ? 'text-slate-900 bg-white shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                            >
                                {editingNoteId === note.id ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input 
                                            value={editNoteTitle} 
                                            onChange={(e) => setEditNoteTitle(e.target.value)}
                                            className="bg-white border-2 border-blue-500 rounded-md px-2 py-0.5 text-xs w-full outline-none"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && saveEditingNote(note.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); saveEditingNote(note.id); }} className="text-blue-600 hover:bg-blue-100 p-1 rounded-md">
                                            <Check className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="truncate pr-2">{note.content.title}</span>
                                        {!selectedSubject.isSummary && (
                                            <div className="flex items-center opacity-0 group-hover/note:opacity-100 transition-opacity">
                                                <button onClick={(e) => startEditingNote(note, e)} className="p-1 text-slate-300 hover:text-slate-600 rounded">
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button onClick={(e) => handleDeleteNote(note.id, e)} className="p-1 text-slate-300 hover:text-rose-500 rounded">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                        </div>
                    )}
                </div>
                ))}
            </>
        )}
      </div>

      <div className="p-6 bg-white/50 backdrop-blur-md border-t border-slate-100">
        {selectedSubject && !selectedSubject.isSummary && (
            <button 
            onClick={() => {
                if(!selectedChapter) {
                    alert("Create or select a chapter first!");
                    return;
                }
                setIsCreateNoteModalOpen(true);
            }}
            disabled={!selectedChapter}
            className={`w-full py-3.5 rounded-full font-bold text-sm shadow-xl shadow-slate-200/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${!selectedChapter ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
            >
            <Plus className="w-5 h-5" />
            <span>New Note</span>
            </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
