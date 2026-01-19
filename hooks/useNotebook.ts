
import React, { useState, useEffect } from 'react';
import { Note, Subject, Chapter, Problem, NoteType } from '../types';
import * as StorageService from '../services/storageService';

export const useNotebook = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  const [viewMode, setViewMode] = useState<'EXTENDED' | 'CONDENSED'>('EXTENDED');

  // Initialization & Persistence
  useEffect(() => {
    const data = StorageService.loadData();
    
    // --- MIGRATION: Ensure 1:1 Parity between Normal and Summary Notebooks ---
    let migratedSubjects = [...data.subjects];
    let changed = false;

    // 1. Identify normal subjects
    const normalSubjects = migratedSubjects.filter(s => !s.isSummary);
    
    normalSubjects.forEach(sub => {
        // Check if a summary version exists
        const summaryExists = migratedSubjects.some(s => s.isSummary && s.originalSubjectId === sub.id);
        
        if (!summaryExists) {
            // Create missing summary notebook
            const summarySubject: Subject = {
                id: sub.id + '_summary',
                title: sub.title, // Same title for aesthetic parity
                term: sub.term,
                year: sub.year,
                coverImage: sub.coverImage, // Inherit cover
                isSummary: true,
                originalSubjectId: sub.id
            };
            migratedSubjects.push(summarySubject);
            changed = true;
        }
    });

    setSubjects(migratedSubjects);
    setChapters(data.chapters);
    
    // Migration: Add order to notes if missing
    const migratedNotes = data.notes.map((n, idx) => ({
        ...n,
        order: n.order !== undefined ? n.order : n.createdAt
    }));
    setNotes(migratedNotes);
    
    setSelectedSubject(null);
    setSelectedChapter(null);

    if (changed) {
        StorageService.saveData({ 
            subjects: migratedSubjects, 
            chapters: data.chapters, 
            notes: migratedNotes 
        });
    }
  }, []);

  useEffect(() => {
    StorageService.saveData({ subjects, chapters, notes });
  }, [subjects, chapters, notes]);

  // Actions
  const addSubject = (title: string, term: string, year: string, initialStructure: { title: string, subtopics: string[] }[]) => {
    const newSubjectId = Date.now().toString();
    
    const gradients = [
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)'
    ];
    const randomCover = gradients[Math.floor(Math.random() * gradients.length)];

    const newSubject: Subject = {
      id: newSubjectId,
      title,
      term,
      year,
      coverImage: randomCover, 
      isSummary: false
    };

    const summarySubjectId = newSubjectId + '_summary';
    const summarySubject: Subject = {
        id: summarySubjectId,
        title: title, 
        term,
        year,
        coverImage: randomCover, 
        isSummary: true,
        originalSubjectId: newSubjectId
    };
    
    setSubjects([...subjects, newSubject, summarySubject]);
    setSelectedSubject(newSubject);
    
    let newChapters: Chapter[] = [];
    let newNotes: Note[] = [];

    if (initialStructure.length > 0) {
        initialStructure.forEach((module, idx) => {
            const chapId = `${newSubjectId}_c${idx}_${Date.now()}`;
            newChapters.push({
                id: chapId,
                subjectId: newSubjectId,
                title: module.title,
                summaryTable: ''
            });

            module.subtopics.forEach((sub, sIdx) => {
                newNotes.push({
                    id: `${chapId}_n${sIdx}_${Date.now()}`,
                    subjectId: newSubjectId,
                    chapterId: chapId,
                    createdAt: Date.now() + sIdx,
                    order: sIdx, // Initialize Order
                    type: NoteType.CONCEPT,
                    images: [],
                    content: {
                        title: sub,
                        subtopic: module.title, 
                        analogy: 'N/A',
                        conceptualLogic: 'Placeholder',
                        condensedReview: [],
                        extendedExplanation: '',
                        classProblems: [],
                        visuals: [],
                        editorContent: `<h1>${sub}</h1><p>Start writing here...</p>`
                    }
                });
            });
        });
        
        setChapters(prev => [...prev, ...newChapters]);
        setNotes(prev => [...prev, ...newNotes]);
        setSelectedChapter(newChapters[0]);
    } else {
        setSelectedChapter(null); 
    }
    
    setSelectedNote(null);
  };

  const editSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (selectedSubject?.id === id) {
      setSelectedSubject(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const updateSubjectCover = (id: string, imageUrl: string) => {
      let pairId: string | undefined;
      const target = subjects.find(s => s.id === id);
      
      if (target) {
          if (target.isSummary && target.originalSubjectId) {
              pairId = target.originalSubjectId;
          } else {
              const summary = subjects.find(s => s.originalSubjectId === id);
              if (summary) pairId = summary.id;
          }
      }

      setSubjects(prev => prev.map(s => (s.id === id || s.id === pairId) ? { ...s, coverImage: imageUrl } : s));
  };

  const addChapter = (title: string, specificSubjectId?: string): string => {
    const targetSubjectId = specificSubjectId || selectedSubject?.id;
    if (!targetSubjectId) return '';
    
    const id = Date.now().toString();
    const newChapter: Chapter = {
      id,
      subjectId: targetSubjectId,
      title,
      summaryTable: ''
    };
    
    setChapters(prev => [...prev, newChapter]);
    
    if (!specificSubjectId) {
        setSelectedChapter(newChapter);
        setSelectedNote(null);
    }
    return id;
  };

  const editChapter = (id: string, title: string) => {
    setChapters(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    if (selectedChapter?.id === id) {
      setSelectedChapter(prev => prev ? { ...prev, title } : null);
    }
  };

  const addNote = (note: Note) => {
      setNotes(prev => {
          // Set order to be last in current chapter
          const chapterNotes = prev.filter(n => n.chapterId === note.chapterId);
          const maxOrder = chapterNotes.length > 0 ? Math.max(...chapterNotes.map(n => n.order || 0)) : 0;
          
          return [...prev, { ...note, order: maxOrder + 1 }];
      });
  };

  const appendProblemsToNote = (noteId: string, problems: Problem[]) => {
      setNotes(prev => prev.map(n => {
          if (n.id === noteId) {
              return {
                  ...n,
                  content: {
                      ...n.content,
                      classProblems: [...n.content.classProblems, ...problems]
                  }
              };
          }
          return n;
      }));
      if (selectedNote?.id === noteId) {
          setSelectedNote(prev => {
              if (prev) {
                  return {
                      ...prev,
                      content: {
                          ...prev.content,
                          classProblems: [...prev.content.classProblems, ...problems]
                      }
                  }
              }
              return null;
          });
      }
  };

  const deleteNote = (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) setSelectedNote(null);
    }
  };

  const deleteChapter = (chapterId: string) => {
    if (window.confirm("Delete this chapter and all its notes?")) {
        setChapters(prev => prev.filter(c => c.id !== chapterId));
        setNotes(prev => prev.filter(n => n.chapterId !== chapterId));
        if (selectedChapter?.id === chapterId) {
            setSelectedChapter(null);
            setSelectedNote(null);
        }
    }
  };

  const bulkDeleteSubjects = (ids: string[]) => {
    if (window.confirm(`Delete ${ids.length} notebooks?`)) {
        const allIdsToDelete = new Set<string>();
        ids.forEach(id => {
            allIdsToDelete.add(id);
            if (id.endsWith('_summary')) {
                allIdsToDelete.add(id.replace('_summary', ''));
            } else {
                allIdsToDelete.add(id + '_summary');
            }
        });
        const finalIds = Array.from(allIdsToDelete);
        setSubjects(prev => prev.filter(s => !finalIds.includes(s.id)));
        setChapters(prev => prev.filter(c => !finalIds.includes(c.subjectId)));
        setNotes(prev => prev.filter(n => !finalIds.includes(n.subjectId)));
        if (selectedSubject && finalIds.includes(selectedSubject.id)) {
            setSelectedSubject(null);
            setSelectedChapter(null);
            setSelectedNote(null);
        }
    }
  };

  const bulkDeleteChapters = (ids: string[]) => {
    if (window.confirm(`Delete ${ids.length} chapters?`)) {
        setChapters(prev => prev.filter(c => !ids.includes(c.id)));
        setNotes(prev => prev.filter(n => !ids.includes(n.chapterId)));
        if (selectedChapter && ids.includes(selectedChapter.id)) {
            setSelectedChapter(null);
            setSelectedNote(null);
        }
    }
  };

  const updateNoteContent = (noteId: string, payload: any) => {
      const isPartialNote = 'content' in payload || 'images' in payload;
      let finalPayload = payload;
      let isTitleUpdate = false;

      if (!isPartialNote && payload.title && Object.keys(payload).length === 1) {
          isTitleUpdate = true;
          setNotes(prev => prev.map(n => {
              if (n.id === noteId) {
                  return { ...n, content: { ...n.content, title: payload.title } };
              }
              return n;
          }));
      } else {
          setNotes(prev => prev.map(n => {
              if (n.id === noteId) {
                  if (isPartialNote) {
                      return { ...n, ...finalPayload }; 
                  } else {
                      return { ...n, content: finalPayload }; 
                  }
              }
              return n;
          }));
      }

      if (selectedNote?.id === noteId) {
          setSelectedNote(prev => {
              if (prev) {
                   if (isTitleUpdate) {
                       return { ...prev, content: { ...prev.content, title: payload.title } };
                   }
                  if (isPartialNote) {
                      return { ...prev, ...finalPayload };
                  } else {
                      return { ...prev, content: finalPayload };
                  }
              }
              return null;
          });
      }
  };

  const updateChapterSummary = (chapterId: string, summary: string) => {
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, summaryTable: summary } : c));
  };

  // --- NEW: Reorder Notes Function ---
  const reorderNotes = (chapterId: string, fromIndex: number, toIndex: number) => {
      setNotes(prevNotes => {
          // 1. Get notes for this chapter sorted by current order
          const chapterNotes = prevNotes
              .filter(n => n.chapterId === chapterId)
              .sort((a, b) => (a.order || 0) - (b.order || 0));
          
          const otherNotes = prevNotes.filter(n => n.chapterId !== chapterId);

          // 2. Perform the move
          const [movedNote] = chapterNotes.splice(fromIndex, 1);
          chapterNotes.splice(toIndex, 0, movedNote);

          // 3. Reassign 'order' property
          const updatedChapterNotes = chapterNotes.map((note, index) => ({
              ...note,
              order: index
          }));

          return [...otherNotes, ...updatedChapterNotes];
      });
  };

  const exportData = () => {
    const data = { subjects, chapters, notes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `physinote_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>, onSuccess: () => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (StorageService.validateData(json)) {
                if (window.confirm(`Found ${json.notes.length} notes in backup. Merge them into your current notebook?`)) {
                    setSubjects(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const newItems = json.subjects.filter(i => !existingIds.has(i.id));
                        return [...prev, ...newItems];
                    });
                    setChapters(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const newItems = json.chapters.filter(i => !existingIds.has(i.id));
                        return [...prev, ...newItems];
                    });
                    setNotes(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const newItems = json.notes.filter(i => !existingIds.has(i.id));
                        return [...prev, ...newItems];
                    });
                    alert("Import successful! Your notes have been merged.");
                    onSuccess();
                }
            } else {
                alert("Invalid backup file format.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to parse backup file.");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return {
    subjects, chapters, notes,
    selectedSubject, selectedChapter, selectedNote,
    setSelectedSubject, setSelectedChapter, setSelectedNote,
    addSubject, addChapter, addNote, appendProblemsToNote,
    editSubject, editChapter, updateSubjectCover,
    deleteNote, deleteChapter, bulkDeleteSubjects, bulkDeleteChapters,
    updateNoteContent, updateChapterSummary,
    reorderNotes, // Export new function
    viewMode, setViewMode,
    exportData, importData
  };
};
