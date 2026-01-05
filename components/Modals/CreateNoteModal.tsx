
import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, ArrowRight, Check, BookOpen, Calculator, Plus, ChevronDown, FolderOpen, FilePlus, GitMerge, FileText, BrainCircuit, UploadCloud, Search } from 'lucide-react';
import { NoteType, DetailLevel, Note, Chapter } from '../../types';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNote: (config: any) => void; // Using any for the wizard config payload
  chapters: Chapter[];
  notes: Note[]; // Need notes to list existing subtopics
  selectedChapterId: string | null;
  subjectId: string;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateNote, 
  chapters,
  notes,
  selectedChapterId,
  subjectId
}) => {
  if (!isOpen) return null;
  
  // State
  const [step, setStep] = useState(1); // 1: Config, 2: Upload
  
  // Configuration
  const [targetChapterId, setTargetChapterId] = useState<string>(selectedChapterId || (chapters[0]?.id) || '');
  
  // Subtopic / Placement Logic
  // If user selects existing note ID -> MERGE
  // If user types new string -> NEW
  // If empty -> AUTO
  const [subtopicInput, setSubtopicInput] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null); // If an existing note is selected from dropdown
  
  const [mode, setMode] = useState<'CONCEPT' | 'PROBLEM' | 'BLANK'>('CONCEPT');
  const [includeAddOn, setIncludeAddOn] = useState(false); // If Concept: "Add Practice?". If Problem: "Add Concepts?"
  
  // Upload Data
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dropdown UI State
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  
  const chapterDropdownRef = useRef<HTMLDivElement>(null);
  const topicDropdownRef = useRef<HTMLDivElement>(null);

  // Derived: Notes in selected chapter
  const chapterNotes = notes.filter(n => n.chapterId === targetChapterId).sort((a,b) => b.createdAt - a.createdAt);

  // Reset on open
  useEffect(() => {
      if (isOpen) {
          setStep(1);
          setTargetChapterId(selectedChapterId || (chapters[0]?.id) || '');
          setSubtopicInput('');
          setSelectedNoteId(null);
          setMode('CONCEPT');
          setIncludeAddOn(false);
          setInput('');
          setFile(null);
          setIsDragging(false);
          setIsChapterDropdownOpen(false);
          setIsTopicDropdownOpen(false);
      }
  }, [isOpen, selectedChapterId, chapters]);

  // Click outside listener for dropdowns
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(event.target as Node)) {
              setIsChapterDropdownOpen(false);
          }
          if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target as Node)) {
              setIsTopicDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Paste listener
  useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
          if (step !== 2) return; 
          const items = e.clipboardData?.items;
          if (!items) return;

          for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf('image') !== -1) {
                  const blob = items[i].getAsFile();
                  if (blob) {
                      e.preventDefault();
                      const pastedFile = new File([blob], `pasted_image_${Date.now()}.png`, { type: blob.type });
                      setFile(pastedFile);
                  }
              }
          }
      };

      window.addEventListener('paste', handlePaste);
      return () => window.removeEventListener('paste', handlePaste);
  }, [step]);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const droppedFile = e.dataTransfer.files[0];
          if (droppedFile.type.startsWith('image/')) {
              setFile(droppedFile);
          } else {
              alert("Please drop an image file.");
          }
      }
  };

  const handleQuickSubtopicCreate = () => {
      if (!subtopicInput) return;
      
      const payload = {
         id: Date.now().toString(),
         text: '',
         file: null,
         subjectId,
         chapterId: targetChapterId,
         
         targetNoteId: undefined,
         forceNewNote: true, // Force creation
         customSubtopic: subtopicInput.trim(),

         mode: 'BLANK', // Use Blank mode logic to bypass AI
         includeAddOn: false,
         createdAt: Date.now()
     };
     
     onCreateNote(payload);
     onClose();
  };

  const handleSubmit = () => {
     // Determine Strategy based on Subtopic Input
     let strategy: 'AUTO' | 'MERGE' | 'NEW' = 'AUTO';
     let finalTargetNoteId = undefined;
     let finalCustomSubtopic = undefined;

     if (selectedNoteId) {
         strategy = 'MERGE';
         finalTargetNoteId = selectedNoteId;
     } else if (subtopicInput.trim()) {
         // Check if user typed an exact match to an existing note (case insensitive)
         const existing = chapterNotes.find(n => n.content.title.toLowerCase() === subtopicInput.trim().toLowerCase());
         if (existing) {
             strategy = 'MERGE';
             finalTargetNoteId = existing.id;
         } else {
             strategy = 'NEW';
             finalCustomSubtopic = subtopicInput.trim();
         }
     } else {
         strategy = 'AUTO';
     }

     const payload = {
         id: Date.now().toString(),
         text: input,
         file: file,
         subjectId,
         chapterId: targetChapterId,
         
         // Mapped Placement Fields
         targetNoteId: finalTargetNoteId,
         forceNewNote: strategy === 'NEW',
         customSubtopic: finalCustomSubtopic,

         mode,
         includeAddOn,
         createdAt: Date.now()
     };
     
     onCreateNote(payload);
     onClose();
  };

  const getSelectedChapterLabel = () => {
      const ch = chapters.find(c => c.id === targetChapterId);
      return ch ? ch.title : "Select Chapter";
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 transform transition-all scale-100 relative overflow-visible">
         
         <div className="absolute top-8 right-8 z-20">
            <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition">
                <X className="w-5 h-5" />
            </button>
         </div>

         {mode !== 'BLANK' && (
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 rounded-t-[2.5rem] overflow-hidden">
                 <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }}></div>
             </div>
         )}

         {step === 1 && (
             <div className="animate-fade-in space-y-6 mt-4">
                 <div className="mb-4">
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">New Entry</h3>
                    <p className="text-sm text-slate-500 font-medium">Add content to your notebook.</p>
                </div>

                {/* 1. Chapter Selector (Secondary) */}
                <div className="relative" ref={chapterDropdownRef}>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Chapter</label>
                     
                     <button 
                        onClick={() => setIsChapterDropdownOpen(!isChapterDropdownOpen)}
                        className={`w-full text-left bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl p-3 outline-none flex items-center gap-3 transition-all ${isChapterDropdownOpen ? 'ring-2 ring-blue-500/20 bg-white' : 'hover:bg-slate-100'}`}
                     >
                        <FolderOpen className="w-4 h-4 text-slate-400" />
                        <span className="truncate flex-1 text-sm">{getSelectedChapterLabel()}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isChapterDropdownOpen ? 'rotate-180' : ''}`} />
                     </button>

                     {isChapterDropdownOpen && (
                         <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-30 animate-slide-down max-h-[200px] overflow-y-auto">
                             {chapters.map(c => (
                                 <button 
                                    key={c.id}
                                    onClick={() => { setTargetChapterId(c.id); setIsChapterDropdownOpen(false); }}
                                    className={`w-full text-left p-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${targetChapterId === c.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                                 >
                                    <FolderOpen className="w-4 h-4 text-slate-400" />
                                    {c.title}
                                    {targetChapterId === c.id && <Check className="w-3.5 h-3.5 text-blue-600 ml-auto" />}
                                 </button>
                             ))}
                         </div>
                     )}
                </div>

                {/* 2. Subtopic Selector (Primary Destination) */}
                <div className="relative" ref={topicDropdownRef}>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subtopic / Topic</label>
                     
                     <div className="relative">
                        <input 
                            value={subtopicInput}
                            onChange={(e) => {
                                setSubtopicInput(e.target.value);
                                setSelectedNoteId(null); // Clear manual selection if typing
                                setIsTopicDropdownOpen(true);
                            }}
                            onFocus={() => setIsTopicDropdownOpen(true)}
                            placeholder={chapterNotes.length > 0 ? "Select existing or type new..." : "Type a new subtopic name..."}
                            className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pl-11 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                             {selectedNoteId ? <GitMerge className="w-4 h-4 text-amber-500" /> : <FileText className="w-4 h-4" />}
                        </div>
                        {subtopicInput && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button 
                                    onClick={handleQuickSubtopicCreate}
                                    title="Quick Add Subtopic (Empty)"
                                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold px-1">Add</span>
                                </button>
                                <button 
                                    onClick={() => { setSubtopicInput(''); setSelectedNoteId(null); }}
                                    className="text-slate-300 hover:text-slate-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                     </div>

                     {/* Dropdown for Autocomplete */}
                     {isTopicDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 animate-slide-down max-h-[250px] overflow-y-auto">
                            {/* Option: Create New */}
                            {subtopicInput && !chapterNotes.some(n => n.content.title.toLowerCase() === subtopicInput.toLowerCase()) && (
                                <button 
                                    onClick={() => { setIsTopicDropdownOpen(false); setSelectedNoteId(null); }}
                                    className="w-full text-left p-3 rounded-xl hover:bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center gap-3 transition-colors mb-1"
                                >
                                    <div className="bg-emerald-100 p-1.5 rounded-lg"><Plus className="w-4 h-4" /></div>
                                    <div>
                                        <span>Create New: "{subtopicInput}"</span>
                                        <p className="text-[10px] font-medium text-emerald-600/70">Start a fresh subtopic</p>
                                    </div>
                                </button>
                            )}

                            {/* Option: Auto Detect */}
                            {!subtopicInput && (
                                <button 
                                    onClick={() => { setSubtopicInput(''); setSelectedNoteId(null); setIsTopicDropdownOpen(false); }}
                                    className="w-full text-left p-3 rounded-xl hover:bg-blue-50 text-blue-700 font-bold text-sm flex items-center gap-3 transition-colors mb-1"
                                >
                                    <div className="bg-blue-100 p-1.5 rounded-lg"><BrainCircuit className="w-4 h-4" /></div>
                                    <div>
                                        <span>Smart Auto-Detect</span>
                                        <p className="text-[10px] font-medium text-blue-600/70">Let AI decide based on content</p>
                                    </div>
                                    <Check className="w-4 h-4 ml-auto" />
                                </button>
                            )}

                            {/* Existing Notes */}
                            {chapterNotes.length > 0 && <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 mt-1">Existing Subtopics</div>}
                            
                            {chapterNotes
                                .filter(n => n.content.title.toLowerCase().includes(subtopicInput.toLowerCase()))
                                .map(n => (
                                <button 
                                    key={n.id}
                                    onClick={() => { setSubtopicInput(n.content.title); setSelectedNoteId(n.id); setIsTopicDropdownOpen(false); }}
                                    className="w-full text-left p-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                >
                                    <div className="bg-slate-100 p-1.5 rounded-lg text-slate-400"><FileText className="w-4 h-4" /></div>
                                    <span className="truncate">{n.content.title}</span>
                                    {selectedNoteId === n.id && <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Merge</span>}
                                </button>
                            ))}
                        </div>
                     )}
                </div>

                {/* Content Type Selection */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Content Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setMode('CONCEPT')}
                            className={`p-6 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-3 text-center ${mode === 'CONCEPT' ? 'border-pink-500 bg-pink-50 shadow-md transform scale-[1.02]' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'}`}
                        >
                             <div className={`p-3 rounded-full ${mode === 'CONCEPT' ? 'bg-pink-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                 <BookOpen className="w-6 h-6" />
                             </div>
                             <span className={`font-bold text-sm ${mode === 'CONCEPT' ? 'text-pink-900' : 'text-slate-600'}`}>AI Concept</span>
                        </button>
                        
                        <button 
                            onClick={() => setMode('PROBLEM')}
                            className={`p-6 rounded-3xl border-2 transition-all duration-200 flex flex-col items-center gap-3 text-center ${mode === 'PROBLEM' ? 'border-indigo-500 bg-indigo-50 shadow-md transform scale-[1.02]' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'}`}
                        >
                             <div className={`p-3 rounded-full ${mode === 'PROBLEM' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                 <Calculator className="w-6 h-6" />
                             </div>
                             <span className={`font-bold text-sm ${mode === 'PROBLEM' ? 'text-indigo-900' : 'text-slate-600'}`}>AI Problem</span>
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setMode('BLANK');
                        }} 
                        className={`w-full mt-4 p-4 rounded-3xl border-2 flex items-center justify-between gap-3 text-left hover:shadow-md transition-all ${mode === 'BLANK' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'}`}
                    >
                         <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl ${mode === 'BLANK' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                                 <FilePlus className="w-5 h-5" />
                             </div>
                             <span className={`font-bold text-sm ${mode === 'BLANK' ? 'text-emerald-900' : 'text-slate-700'}`}>Start from Blank Page</span>
                         </div>
                         {mode === 'BLANK' && <Check className="w-5 h-5 text-emerald-600" />}
                    </button>
                </div>

                {mode !== 'BLANK' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${includeAddOn ? 'bg-pink-500 border-pink-500' : 'bg-white border-slate-300'}`}>
                                {includeAddOn && <Check className="w-4 h-4 text-white" />}
                                <input type="checkbox" className="hidden" checked={includeAddOn} onChange={(e) => setIncludeAddOn(e.target.checked)} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                                {mode === 'CONCEPT' ? 'Generate 3 Practice Problems?' : 'Explain Concepts & Analogies?'}
                            </span>
                        </label>
                    </div>
                )}

                <button 
                    onClick={mode === 'BLANK' ? handleSubmit : () => setStep(2)}
                    disabled={!targetChapterId}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-4 rounded-full font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                >
                    {mode === 'BLANK' ? (
                        <>
                            <Check className="w-5 h-5" />
                            <span>Create Note Now</span>
                        </>
                    ) : (
                        <>
                            <span>Next Step</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
             </div>
         )}

         {/* --- STEP 2: UPLOAD (AI Only) --- */}
         {step === 2 && mode !== 'BLANK' && (
             <div className="animate-fade-in space-y-6 mt-4">
                 <div className="mb-4">
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Upload Content</h3>
                    <p className="text-sm text-slate-500 font-medium">
                        {mode === 'CONCEPT' ? 'Upload slides, blackboard, or definitions.' : 'Upload homework questions or equations.'}
                    </p>
                </div>

                {/* Upload */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Image Source</label>
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-3xl p-6 text-center transition cursor-pointer relative group flex flex-col items-center justify-center min-h-[160px] ${isDragging ? 'border-pink-500 bg-pink-50 scale-[1.02]' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className={`p-3 rounded-full mb-2 transition-transform shadow-sm ${isDragging ? 'bg-pink-600 text-white scale-110' : 'bg-pink-50 text-pink-600 group-hover:scale-110'}`}>
                                {isDragging ? <UploadCloud className="w-6 h-6" /> : <Camera className="w-5 h-5" />}
                            </div>
                            <span className={`text-sm font-bold ${isDragging ? 'text-pink-700' : 'text-slate-600'}`}>
                                {file ? file.name : (isDragging ? "Drop Image Here" : "Drag from Photos, Paste, or Click")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Text Input */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Extra Notes</label>
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-3xl p-5 h-24 text-sm focus:ring-2 focus:ring-pink-500/20 focus:bg-white transition-all outline-none resize-none font-medium text-slate-700"
                        placeholder="Add context or specific instructions..."
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => setStep(1)}
                        className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-full font-bold hover:bg-slate-200 transition-colors"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!file && !input}
                        className="flex-[2] bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-4 rounded-full font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        <span>Process</span>
                    </button>
                </div>
             </div>
         )}

      </div>
    </div>
  );
};

export default CreateNoteModal;
