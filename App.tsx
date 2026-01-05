
import React, { useState } from 'react';
import { NoteType, DetailLevel, QueueItem, Note } from './types';

// Hooks
import { useNotebook } from './hooks/useNotebook';
import { useAIQueue } from './hooks/useAIQueue';
import { useChat } from './hooks/useChat';
import { useStudyTools } from './hooks/useStudyTools';

// Components
import Sidebar from './components/Layout/Sidebar';
import TopNav from './components/Layout/TopNav';
import NotebookGallery from './components/Layout/NotebookGallery';
import NoteView from './components/NoteView/NoteView';
import SummaryView from './components/NoteView/SummaryView';
import ChatPanel from './components/Chat/ChatPanel';
import FloatingQueue from './components/Shared/FloatingQueue';

// Modals
import CreateNoteModal from './components/Modals/CreateNoteModal';
import CreateSubjectModal from './components/Modals/CreateSubjectModal';
import CreateChapterModal from './components/Modals/CreateChapterModal';
import SettingsModal from './components/Modals/SettingsModal';
import ZoomModal from './components/Modals/ZoomModal';
import PracticeModal from './components/Modals/PracticeModal';
import CheatSheetModal from './components/Modals/CheatSheetModal';
import ManageContentModal from './components/Modals/ManageContentModal';
import SummarizeModal from './components/Modals/SummarizeModal';

const App: React.FC = () => {
  // Core Data & Logic Hooks
  const notebook = useNotebook();
  const queue = useAIQueue(
      notebook.notes, 
      notebook.addNote, 
      notebook.addChapter, 
      notebook.setSelectedNote, 
      notebook.appendProblemsToNote,
      notebook.updateNoteContent
  );
  const chat = useChat(notebook.selectedNote, notebook.updateNoteContent);
  const tools = useStudyTools(notebook.notes, notebook.updateChapterSummary);
  
  // UI State
  // Sidebar is now controlled by whether a subject is selected, but we allow manual toggling while inside a notebook
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeGalleryMode, setActiveGalleryMode] = useState<'NORMAL' | 'SUMMARY'>('NORMAL');
  const [zoomContent, setZoomContent] = useState<{ type: 'image' | 'svg', data: string } | null>(null);

  // Modal Visibility State
  const [modals, setModals] = useState({
    createNote: false,
    createSubject: false,
    createChapter: false,
    settings: false,
    practice: false,
    cheatSheet: false,
    manageContent: false,
    summarize: false
  });

  const toggleModal = (modal: keyof typeof modals, isOpen: boolean) => {
    setModals(prev => ({ ...prev, [modal]: isOpen }));
  };

  // Handlers for App Actions
  const handleWizardSubmit = async (payload: any) => {
    let finalChapterId = payload.chapterId;
    if (finalChapterId === 'NEW' && payload.newChapterTitle) {
        finalChapterId = notebook.addChapter(payload.newChapterTitle, payload.subjectId);
    }

    // --- INSTANT BLANK NOTE CREATION ---
    if (payload.mode === 'BLANK') {
        const newNote: Note = {
            id: payload.id,
            subjectId: payload.subjectId,
            chapterId: finalChapterId,
            createdAt: Date.now(),
            type: NoteType.CONCEPT,
            images: [],
            content: {
                title: payload.customSubtopic || 'Untitled Note', // Use custom title if provided
                subtopic: payload.customSubtopic ? 'Manual Entry' : 'New Topic',
                analogy: 'N/A',
                conceptualLogic: 'Start writing here...',
                condensedReview: [],
                extendedExplanation: '', 
                classProblems: [],
                visuals: [],
                editorContent: `<h1>${payload.customSubtopic || 'Untitled Note'}</h1><p>Start writing here...</p>` // Seed Tiptap
            }
        };
        notebook.addNote(newNote);
        notebook.setSelectedNote(newNote);
        return; // Skip queue
    }

    // --- AI PROCESSING QUEUE ---
    let base64Image = undefined;
    if (payload.file) {
        const reader = new FileReader();
        base64Image = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
            reader.readAsDataURL(payload.file);
        });
    }

    const queueItem: QueueItem = {
        id: payload.id,
        text: payload.text,
        fileBase64: base64Image,
        subjectId: payload.subjectId,
        chapterId: finalChapterId, 
        newChapterTitle: undefined, 
        
        // Placement Strategy
        targetNoteId: payload.targetNoteId,
        forceNewNote: payload.forceNewNote,
        customSubtopic: payload.customSubtopic,

        mode: payload.mode,
        includeAddOn: payload.includeAddOn,
        createdAt: payload.createdAt,
        taskType: 'CREATE'
    };
    
    queue.addToQueue(queueItem);
  };

  const handleBatchSummarize = async (chapterIds: string[]) => {
      const currentSubjectId = notebook.selectedSubject?.id;
      if (!currentSubjectId) return;

      const summarySubject = notebook.subjects.find(s => s.originalSubjectId === currentSubjectId && s.isSummary);
      if (!summarySubject) {
          alert("Could not find the summary notebook. Try creating a new notebook.");
          return;
      }

      for (const chapId of chapterIds) {
          const originalChapter = notebook.chapters.find(c => c.id === chapId);
          if (!originalChapter) continue;

          let summaryChapter = notebook.chapters.find(c => c.subjectId === summarySubject.id && c.title === originalChapter.title);
          if (!summaryChapter) {
             const newId = notebook.addChapter(originalChapter.title, summarySubject.id);
             summaryChapter = { id: newId, subjectId: summarySubject.id, title: originalChapter.title };
          }

          const notesToSummarize = notebook.notes.filter(n => n.chapterId === chapId);

          for (const note of notesToSummarize) {
               queue.addToQueue({
                   id: Date.now().toString() + Math.random(),
                   text: '',
                   subjectId: summarySubject.id,
                   chapterId: summaryChapter.id,
                   mode: 'CONCEPT',
                   includeAddOn: false,
                   createdAt: Date.now(),
                   taskType: 'SUMMARIZE',
                   sourceNote: note
               });
          }
      }
  };

  const handlePracticeRequest = () => {
    if (!notebook.selectedNote) return;
    tools.generatePractice(notebook.selectedNote);
    toggleModal('practice', true);
  };

  const handleCheatSheetRequest = async () => {
    if (!notebook.selectedChapter) return;
    await tools.generateCheatSheet(notebook.selectedChapter);
    toggleModal('cheatSheet', true);
  };

  const isInNotebook = !!notebook.selectedSubject;

  return (
    <div className="min-h-screen flex font-sans text-slate-900 antialiased selection:bg-pink-100 selection:text-pink-900 bg-white">
      
      {/* Sidebar: Only visible when a subject is selected */}
      {isInNotebook && (
          <Sidebar 
            isSidebarOpen={isSidebarOpen}
            subjects={notebook.subjects}
            chapters={notebook.chapters}
            notes={notebook.notes}
            selectedSubject={notebook.selectedSubject}
            selectedChapter={notebook.selectedChapter}
            selectedNote={notebook.selectedNote}
            setSelectedSubject={(s) => {
                notebook.setSelectedSubject(s);
                if (s) {
                    const firstChap = notebook.chapters.find(c => c.subjectId === s.id);
                    notebook.setSelectedChapter(firstChap || null);
                } else {
                    notebook.setSelectedChapter(null);
                }
                notebook.setSelectedNote(null);
            }}
            setSelectedChapter={notebook.setSelectedChapter}
            setSelectedNote={notebook.setSelectedNote}
            setIsCreateSubjectModalOpen={(o) => toggleModal('createSubject', o)}
            setIsCreateChapterModalOpen={(o) => toggleModal('createChapter', o)}
            setIsCreateNoteModalOpen={(o) => toggleModal('createNote', o)}
            handleDeleteChapter={(id, e) => { e.stopPropagation(); notebook.deleteChapter(id); }}
            handleDeleteNote={(id, e) => { e.stopPropagation(); notebook.deleteNote(id); }}
            handleEditChapter={notebook.editChapter}
            handleEditNote={(id, title) => notebook.updateNoteContent(id, { title })}
          />
      )}

      {/* Main Content Area */}
      <div 
        className={`flex-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] 
        ${isInNotebook && isSidebarOpen ? 'ml-80' : 'ml-0'}`}
      >
        <TopNav 
           isSidebarOpen={isSidebarOpen}
           setIsSidebarOpen={setIsSidebarOpen}
           setIsSettingsModalOpen={(o) => toggleModal('settings', o)}
           showSidebarToggle={isInNotebook} // Only show toggle if we are in a notebook
        />

        {/* Content Render */}
        <main className={`pt-8 pb-24 print:p-0 print:pb-0 ${isInNotebook ? 'px-12' : 'px-4 sm:px-8 max-w-[1600px] mx-auto'}`}>
          {!notebook.selectedSubject ? (
              // FULL WIDTH GALLERY (No Sidebar)
              <NotebookGallery 
                 mode={activeGalleryMode}
                 setMode={setActiveGalleryMode}
                 subjects={notebook.subjects}
                 onSelectSubject={(s) => {
                     notebook.setSelectedSubject(s);
                     const firstChap = notebook.chapters.find(c => c.subjectId === s.id);
                     notebook.setSelectedChapter(firstChap || null);
                     notebook.setSelectedNote(null);
                     setIsSidebarOpen(true); // Auto-open sidebar on entry
                 }}
                 onAddSubject={() => toggleModal('createSubject', true)}
                 onUpdateCover={notebook.updateSubjectCover}
              />
          ) : (
             // WORKSPACE VIEW (Has Sidebar)
             // CONDITIONAL: Use NoteView for continuous scroll IF we are in normal mode, or if summary mode has items
             // The Notebook view now handles "Empty" states internally if lists are empty but subject is selected
             notebook.selectedSubject.isSummary && !notebook.selectedChapter ? (
                <SummaryView 
                selectedSubject={notebook.selectedSubject}
                selectedChapter={notebook.selectedChapter}
                handleGenerateCheatSheet={handleCheatSheetRequest}
                handleUpdateSummary={() => notebook.selectedChapter && tools.updateSummary(notebook.selectedChapter)}
                summaryLoading={tools.summaryLoading}
                onOpenSummarizeModal={() => toggleModal('summarize', true)}
                />
            ) : (
                <NoteView 
                    notes={notebook.notes.filter(n => n.subjectId === notebook.selectedSubject?.id)}
                    chapters={notebook.chapters.filter(c => c.subjectId === notebook.selectedSubject?.id)}
                    activeId={notebook.selectedNote?.id || notebook.selectedChapter?.id || null}
                    
                    selectedSubject={notebook.selectedSubject}
                    viewMode={notebook.viewMode}
                    setViewMode={notebook.setViewMode}
                    handleDeleteNote={(id, e) => { notebook.deleteNote(id); }}
                    setZoomContent={setZoomContent}
                    handleGeneratePractice={handlePracticeRequest}
                    setIsChatOpen={setIsChatOpen}
                    isChatOpen={isChatOpen}
                    onUpdateNote={notebook.updateNoteContent}
                />
            )
          )}
        </main>
      </div>

      {/* Shared UI Overlays */}
      <FloatingQueue 
         currentTask={queue.currentTask}
         queueLength={queue.queue.length}
         batchCompletedCount={queue.batchCompletedCount}
         batchTotalCount={queue.batchTotalCount}
         loadingStepText={queue.loadingStepText}
      />

      <ChatPanel 
         isChatOpen={isChatOpen}
         setIsChatOpen={setIsChatOpen}
         chatHistory={chat.chatHistory}
         chatInput={chat.chatInput}
         setChatInput={chat.setChatInput}
         handleSendMessage={chat.handleSendMessage}
         chatScrollRef={chat.chatScrollRef}
      />

      {/* Modals */}
      <CreateNoteModal 
        isOpen={modals.createNote}
        onClose={() => toggleModal('createNote', false)}
        onCreateNote={handleWizardSubmit}
        chapters={notebook.chapters.filter(c => c.subjectId === notebook.selectedSubject?.id)}
        notes={notebook.notes.filter(n => n.subjectId === notebook.selectedSubject?.id)}
        selectedChapterId={notebook.selectedChapter?.id || null}
        subjectId={notebook.selectedSubject?.id || ''}
      />
      <CreateSubjectModal 
        isOpen={modals.createSubject}
        onClose={() => toggleModal('createSubject', false)}
        onCreateSubject={notebook.addSubject}
      />
      <CreateChapterModal 
        isOpen={modals.createChapter}
        onClose={() => toggleModal('createChapter', false)}
        onCreateChapter={notebook.addChapter}
      />
      <PracticeModal 
        isOpen={modals.practice}
        onClose={() => toggleModal('practice', false)}
        practiceProblems={tools.practiceProblems}
        generating={tools.generatingPractice}
      />
      <CheatSheetModal 
        isOpen={modals.cheatSheet}
        onClose={() => toggleModal('cheatSheet', false)}
        content={tools.cheatSheetContent}
        selectedChapter={notebook.selectedChapter}
      />
      <ZoomModal 
        content={zoomContent}
        onClose={() => setZoomContent(null)}
      />
      <SettingsModal 
        isOpen={modals.settings}
        onClose={() => toggleModal('settings', false)}
        onExport={notebook.exportData}
        onImport={(e) => notebook.importData(e, () => toggleModal('settings', false))}
        onOpenManageContent={() => toggleModal('manageContent', true)}
        subjects={notebook.subjects}
        chapters={notebook.chapters}
        notes={notebook.notes}
      />
      <ManageContentModal 
        isOpen={modals.manageContent}
        onClose={() => toggleModal('manageContent', false)}
        subjects={notebook.subjects}
        chapters={notebook.chapters}
        onEditSubject={notebook.editSubject}
        onEditChapter={notebook.editChapter}
        onDeleteSubjects={notebook.bulkDeleteSubjects}
        onDeleteChapters={notebook.bulkDeleteChapters}
      />
      <SummarizeModal 
        isOpen={modals.summarize}
        onClose={() => toggleModal('summarize', false)}
        chapters={notebook.chapters.filter(c => c.subjectId === notebook.selectedSubject?.id)}
        onSummarize={handleBatchSummarize}
      />

    </div>
  );
};

export default App;
