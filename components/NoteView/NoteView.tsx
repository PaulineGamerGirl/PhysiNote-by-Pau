
import React, { useEffect, useState, useRef } from 'react';
import { 
  Trash2, 
  Download, 
  Zap, 
  Sigma, 
  MessageSquare,
  AlignJustify,
  Loader2,
  GripVertical
} from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer'; // Keep for Problems
import InteractiveEditor from '../Editor/InteractiveEditor';
import { Note, Subject, Chapter } from '../../types';
import * as GeminiService from '../../services/geminiService';
import { parseMarkdownToHtml } from '../../utils/helpers';

interface NoteViewProps {
  // We now accept the full data set for continuous scrolling
  notes: Note[];
  chapters: Chapter[];
  activeId: string | null; // The ID (Note or Chapter) to scroll to
  
  selectedSubject: Subject | null;
  viewMode: 'EXTENDED' | 'CONDENSED';
  setViewMode: (mode: 'EXTENDED' | 'CONDENSED') => void;
  handleDeleteNote: (noteId: string, e: React.MouseEvent) => void;
  setZoomContent: (content: { type: 'image' | 'svg', data: string } | null) => void;
  handleGeneratePractice: () => void;
  setIsChatOpen: (isOpen: boolean) => void;
  isChatOpen: boolean;
  onUpdateNote?: (noteId: string, content: any) => void; 
  onReorderNotes?: (chapterId: string, fromIndex: number, toIndex: number) => void; // New Prop
}

// --- LAZY NOTE BLOCK COMPONENT ---
// This component only renders the heavy InteractiveEditor when it is visible on screen.
const LazyNoteBlock: React.FC<{ 
    note: Note; 
    showLines: boolean;
    onUpdateNote?: (id: string, content: any) => void;
    onDeleteNote: (id: string, e: React.MouseEvent) => void;
    handleAiTransform: (s: string, i: string) => Promise<string>;
    shouldShowSubtopic: boolean;
    isActive: boolean;
    // DnD Props
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}> = ({ note, showLines, onUpdateNote, onDeleteNote, handleAiTransform, shouldShowSubtopic, isActive, draggable, onDragStart, onDragOver, onDrop }) => {
    
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false); // Once loaded, stay loaded to prevent flicker
    const containerRef = useRef<HTMLDivElement>(null);
    const [editorInitialContent, setEditorInitialContent] = useState<any>(null);

    // Intersection Observer for Lazy Loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    setHasLoaded(true);
                } else if (!hasLoaded) {
                    setIsVisible(false);
                }
            },
            { rootMargin: '600px' } // Load when it's 600px away from viewport
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [hasLoaded]);

    // Migration Logic (UPDATED WITH PARSER)
    useEffect(() => {
        if (note.content.editorContent) {
            setEditorInitialContent(note.content.editorContent);
        } else {
            let migrationHtml = '';
            // Parse conceptual logic with helper
            if (note.content.conceptualLogic && note.content.conceptualLogic !== 'N/A') {
                const parsedConcept = parseMarkdownToHtml(note.content.conceptualLogic);
                migrationHtml += `<h3>Concept</h3>${parsedConcept}`;
            }
            // Parse Extended Explanation with helper
            if (note.content.extendedExplanation) {
                 const parsedNotes = parseMarkdownToHtml(note.content.extendedExplanation);
                 migrationHtml += `<h3>Notes</h3>${parsedNotes}`;
            }
            const userImages = note.images || [];
            if (userImages.length > 0) {
                migrationHtml += `<h2>Visuals</h2>`;
                userImages.forEach(img => {
                    migrationHtml += `<img src="data:image/jpeg;base64,${img}" />`;
                });
            }
            setEditorInitialContent(migrationHtml);
        }
    }, [note.id]);

    const handleEditorUpdate = (json: any) => {
        if (onUpdateNote) {
          const updatedContent = {
              ...note.content,
              editorContent: json
          };
          onUpdateNote(note.id, updatedContent);
        }
    };

    const LINE_HEIGHT = 32;
    const GAP_HEIGHT = 64; 
    const PAGE_CONTENT_HEIGHT = 1024;
    const TOTAL_PAGE_HEIGHT = PAGE_CONTENT_HEIGHT + GAP_HEIGHT;

    return (
        <div 
            ref={containerRef}
            id={`note-${note.id}`}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative w-full max-w-[210mm] transition-all duration-500 mb-12 group ${showLines ? 'lined-paper' : 'bg-white shadow-xl rounded-sm'} ${isActive ? 'ring-2 ring-blue-500 ring-offset-4' : ''}`}
            style={{
                minHeight: '297mm', // Maintain A4 height even when empty/lazy
                backgroundColor: showLines ? 'transparent' : 'white',
                backgroundImage: showLines ? `
                    linear-gradient(to bottom, transparent 31px, #cbd5e1 31px),
                    linear-gradient(to bottom, 
                        white 0px, 
                        white ${PAGE_CONTENT_HEIGHT}px, 
                        #94a3b8 ${PAGE_CONTENT_HEIGHT}px, 
                        transparent ${PAGE_CONTENT_HEIGHT}px,
                        transparent ${TOTAL_PAGE_HEIGHT}px
                    )
                ` : 'none',
                backgroundSize: showLines ? `100% ${LINE_HEIGHT}px, 100% ${TOTAL_PAGE_HEIGHT}px` : 'auto',
                backgroundAttachment: 'local',
            }}
        >
            <div className="px-[20mm] pt-[38px] pb-[32px] relative z-10">
                
                {/* Drag Handle & Delete */}
                <div className="absolute top-4 -right-12 print:hidden opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                     <div className="p-2 bg-slate-100 text-slate-400 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-200">
                         <GripVertical className="w-5 h-5" />
                     </div>
                     <button 
                        onClick={(e) => onDeleteNote(note.id, e)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition"
                     >
                        <Trash2 className="w-5 h-5" />
                     </button>
                </div>

                {/* Title Area */}
                <div className={`mb-[32px] border-b-4 border-slate-900 pb-[28px] notebook-text`}>
                    <h1 className="text-4xl font-black text-slate-900 mb-0 tracking-tight leading-[64px] h-[64px] overflow-visible whitespace-nowrap overflow-ellipsis uppercase">
                        {note.content.title}
                    </h1>
                    {shouldShowSubtopic && (
                        <h2 className="text-lg text-slate-500 font-bold tracking-tight uppercase leading-[32px] h-[32px] flex items-center">
                            {note.content.subtopic}
                        </h2>
                    )}
                </div>

                {/* Analogy Card */}
                {note.content.analogy && note.content.analogy !== 'N/A' && (
                    <div className="bg-[#fffbeb] p-[32px] rounded-sm border-l-4 border-amber-400 shadow-sm print:break-inside-avoid relative mb-[32px]">
                            <div className="flex items-start gap-3">
                                <Zap className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
                                <div className="notebook-text">
                                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-[0px] leading-[32px]">Analogy</span>
                                    <p className="text-slate-800 font-bold leading-[32px] m-0">{note.content.analogy}</p>
                                </div>
                            </div>
                    </div>
                )}

                {/* --- LAZY LOADED EDITOR --- */}
                <div className="notebook-text min-h-[500px]">
                    {hasLoaded || isVisible ? (
                        <InteractiveEditor 
                            key={note.id} 
                            initialContent={editorInitialContent} 
                            onUpdate={handleEditorUpdate}
                            onAiTransform={handleAiTransform}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-[500px] text-slate-300">
                             <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-bold">Loading content...</span>
                             </div>
                        </div>
                    )}
                </div>

                {/* Problems Section */}
                {note.content.classProblems.length > 0 && (
                    <section className="pt-[32px] print:break-before-page border-t-4 border-slate-200 mt-[32px]">
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-[32px] flex items-center gap-3 w-fit leading-[64px] h-[64px]">
                            <Sigma className="w-8 h-8 text-slate-400" />
                            Practice Problems
                        </h3>
                        
                        <div className="space-y-[64px]">
                            {note.content.classProblems.map((prob, idx) => (
                            <div key={idx} className="print:break-inside-avoid">
                                <div className="flex items-start gap-4 mb-[32px]">
                                    <span className="text-2xl font-black text-slate-300 leading-[32px]">#{idx + 1}</span>
                                    <h4 className="font-bold text-slate-900 text-xl leading-[32px]">{prob.question}</h4>
                                </div>
                                <div className="pl-8 border-l-4 border-slate-200 ml-2 space-y-[32px]">
                                    <div className="grid grid-cols-2 gap-4 mb-[32px]">
                                        <div className="bg-slate-50 p-[16px] rounded-sm text-sm border border-slate-200">
                                            <span className="font-black text-slate-400 text-[10px] uppercase block mb-1">Given</span>
                                            <div className="font-mono text-slate-700 font-bold">{prob.given.join(', ')}</div>
                                        </div>
                                        <div className="bg-slate-50 p-[16px] rounded-sm text-sm border border-slate-200">
                                            <span className="font-black text-slate-400 text-[10px] uppercase block mb-1">Answer</span>
                                            <div className="font-black text-slate-900">{prob.answer}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-black text-slate-400 text-[10px] uppercase block mb-[16px]">Solution</span>
                                        <div className="space-y-[32px]">
                                            {(prob.solutionSteps.length > 0 ? prob.solutionSteps : prob.solutionMath).map((step, sIdx) => (
                                                <MarkdownRenderer key={sIdx} content={step} className={showLines ? 'notebook-text' : ''} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};


const NoteView: React.FC<NoteViewProps> = ({
  notes,
  chapters,
  activeId,
  selectedSubject,
  handleDeleteNote,
  handleGeneratePractice,
  setIsChatOpen,
  isChatOpen,
  onUpdateNote,
  onReorderNotes
}) => {
  const [showLines, setShowLines] = useState(true);
  const [draggedNoteIndex, setDraggedNoteIndex] = useState<{ chapterId: string, index: number } | null>(null);

  // --- AUTO SCROLL LOGIC ---
  useEffect(() => {
      if (activeId) {
          // Try to find a note element or chapter element
          const noteEl = document.getElementById(`note-${activeId}`);
          const chapEl = document.getElementById(`chapter-${activeId}`);
          
          if (noteEl) {
              noteEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (chapEl) {
              chapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }, [activeId]);

  const handleAiTransform = async (selection: string, instruction: string): Promise<string> => {
      return await GeminiService.transformSelectedText(selection, instruction);
  };

  // --- DND HANDLERS ---
  const handleDragStart = (e: React.DragEvent, chapterId: string, index: number) => {
      setDraggedNoteIndex({ chapterId, index });
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, chapterId: string, dropIndex: number) => {
      e.preventDefault();
      if (!draggedNoteIndex || !onReorderNotes) return;
      if (draggedNoteIndex.chapterId !== chapterId) return; // Only allow reorder within same chapter for now

      if (draggedNoteIndex.index !== dropIndex) {
          onReorderNotes(chapterId, draggedNoteIndex.index, dropIndex);
      }
      setDraggedNoteIndex(null);
  };

  return (
    <div className="pb-32 animate-fade-in print:pb-0 w-full flex flex-col items-center bg-[#eef2f5]">
      
      {/* Header / Controls */}
      <div className="sticky top-24 z-20 w-full max-w-[210mm] mb-8 mt-0 flex justify-between items-end print:hidden bg-[#eef2f5]/90 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1 tracking-wide uppercase">
                <span className={`px-3 py-1 rounded-full shadow-sm ${selectedSubject?.isSummary ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-500'}`}>
                    {selectedSubject?.isSummary ? 'Summary Deck' : 'Notebook'}
                </span>
                <span>{selectedSubject?.title}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setShowLines(!showLines)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs shadow-sm border transition ${showLines ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200'}`}
            >
                <AlignJustify className="w-4 h-4" />
                {showLines ? 'Lines' : 'Plain'}
            </button>
            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-full font-bold text-xs shadow-sm border border-slate-200 hover:bg-slate-50 transition"
            >
                <Download className="w-4 h-4" />
                Export
            </button>
          </div>
      </div>

      {/* --- CONTINUOUS DOCUMENT FLOW --- */}
      <div className="space-y-16 w-full flex flex-col items-center">
          {chapters.map(chapter => {
              // Sort by Order field if present, otherwise by creation time (legacy fallback)
              const chapterNotes = notes
                .filter(n => n.chapterId === chapter.id)
                .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

              if (chapterNotes.length === 0) return null;

              return (
                  <div key={chapter.id} id={`chapter-${chapter.id}`} className="w-full max-w-[210mm] flex flex-col items-center">
                      
                      {/* Chapter Break/Header */}
                      <div className="w-full flex items-center gap-4 mb-8 opacity-50 px-8">
                          <div className="h-px bg-slate-300 flex-1"></div>
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{chapter.title}</span>
                          <div className="h-px bg-slate-300 flex-1"></div>
                      </div>

                      {/* Notes Loop */}
                      {chapterNotes.map((note, index) => (
                          <LazyNoteBlock
                            key={note.id}
                            note={note}
                            showLines={showLines}
                            onUpdateNote={onUpdateNote}
                            onDeleteNote={handleDeleteNote}
                            handleAiTransform={handleAiTransform}
                            shouldShowSubtopic={note.content.subtopic && !['Manual Entry', 'New Topic', 'Practice'].includes(note.content.subtopic)}
                            isActive={activeId === note.id}
                            
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, chapter.id, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, chapter.id, index)}
                          />
                      ))}
                  </div>
              );
          })}
      </div>

      {/* AI Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl text-white rounded-full p-1.5 shadow-2xl flex items-center gap-1 z-30 print:hidden hover:scale-105 transition-transform duration-200 ring-1 ring-white/10">
         <button 
          onClick={handleGeneratePractice}
          className="flex items-center gap-2 px-6 py-3 hover:bg-white/10 rounded-full transition-colors"
         >
           <Sigma className="w-5 h-5" />
           <span className="text-sm font-bold">Practice</span>
         </button>
         <div className="w-px h-6 bg-white/20"></div>
         <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="flex items-center gap-2 px-6 py-3 hover:bg-white/10 rounded-full transition-colors"
         >
           <MessageSquare className="w-5 h-5" />
           <span className="text-sm font-bold">Assistant</span>
         </button>
      </div>

      <style>{`
        .notebook-text {
            font-family: 'Nunito', sans-serif;
            font-size: 1.125rem; 
            color: #334155;
        }
        .notebook-text p, 
        .notebook-text li {
            line-height: 32px !important;
            margin-bottom: 0px !important; /* Force single spacing */
        }
        .lined-paper {
            cursor: default; /* Fallback */
        }
      `}</style>
    </div>
  );
};

export default NoteView;
