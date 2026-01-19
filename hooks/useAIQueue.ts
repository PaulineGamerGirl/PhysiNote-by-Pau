


import { useState, useEffect } from 'react';
import { QueueItem, NoteType, Note, Problem, DetailLevel } from '../types';
import * as GeminiService from '../services/geminiService';

const LOADING_STEPS = [
  "Analyzing Content...",
  "Structuring Narrative...",
  "Integrating Knowledge...",
  "Processing Visuals...",
  "Finalizing Output..."
];

export const useAIQueue = (
    notes: Note[],
    addNote: (note: Note) => void, 
    addChapter: (title: string, subjectId: string) => string,
    setSelectedNote: (note: Note) => void,
    appendProblemsToNote: (noteId: string, problems: Problem[]) => void,
    updateNoteContent: (noteId: string, content: any) => void
) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentTask, setCurrentTask] = useState<QueueItem | null>(null);
  const [batchCompletedCount, setBatchCompletedCount] = useState(0);
  const [batchTotalCount, setBatchTotalCount] = useState(0);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // Loading Animation Loop
  useEffect(() => {
    let interval: any;
    if (currentTask) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [currentTask]);

  // Queue Processor
  useEffect(() => {
    const processQueue = async () => {
      if (currentTask || queue.length === 0) return;

      const task = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentTask(task);

      try {
        let finalChapterId = task.chapterId;
        
        // 1. Handle New Chapter Creation
        if (task.chapterId === 'NEW' && task.newChapterTitle) {
            finalChapterId = addChapter(task.newChapterTitle, task.subjectId);
        }

        // --- SUMMARIZATION TASK ---
        if (task.taskType === 'SUMMARIZE' && task.sourceNote) {
             const summarizedContent = await GeminiService.summarizeNoteContent(task.sourceNote.content);
             
             const newNote: Note = {
                id: Date.now().toString(),
                subjectId: task.subjectId,
                chapterId: finalChapterId,
                createdAt: Date.now(),
                type: NoteType.CONCEPT,
                domain: task.sourceNote.domain,
                content: summarizedContent,
                images: task.sourceNote.images || []
             };
             addNote(newNote);
        } 
        
        // --- CREATION TASKS ---
        else {
            let targetNote: Note | undefined = undefined;
            let shouldMerge = false;

            // Strategy 1: Explicit Merge Target
            if (task.targetNoteId) {
                targetNote = notes.find(n => n.id === task.targetNoteId);
                shouldMerge = !!targetNote;
            } 
            // Strategy 2: Force New Note (Skip all merge logic)
            else if (task.forceNewNote) {
                shouldMerge = false;
            } 
            // Strategy 3: Auto-Detect (Default Smart Logic)
            else {
                 // Find the most recent note in this chapter
                const chapterNotes = notes.filter(n => n.chapterId === finalChapterId).sort((a,b) => b.createdAt - a.createdAt);
                const previousNote = chapterNotes.length > 0 ? chapterNotes[0] : undefined;

                if (previousNote && task.mode === 'CONCEPT') {
                    const analysis = await GeminiService.analyzeContinuation(task.text, task.fileBase64, previousNote.content);
                    if (analysis.isContinuation) {
                        targetNote = previousNote;
                        shouldMerge = true;
                    }
                }
            }

            // --- EXECUTE MERGE ---
            if (shouldMerge && targetNote) {
                // Use the Integration Agent to rewrite/merge context cohesively
                const integratedContent = await GeminiService.integrateNoteContent(
                    targetNote.content,
                    task.text,
                    task.fileBase64
                );

                // Prepare problems: Strict Ordering [Existing, New from Input, AI Generated]
                let finalProblems = [...targetNote.content.classProblems];
                if (integratedContent.classProblems && integratedContent.classProblems.length > 0) {
                    finalProblems = [...finalProblems, ...integratedContent.classProblems];
                }

                if (task.includeAddOn) {
                    const practiceSet = await GeminiService.generatePracticeProblems(integratedContent.title, integratedContent.extendedExplanation);
                    finalProblems.push(practiceSet.easy, practiceSet.medium, practiceSet.hard);
                }

                // Merge Images and Visuals
                let finalVisuals = [...(targetNote.content.visuals || [])];
                if (integratedContent.visuals && integratedContent.visuals.length > 0) {
                    finalVisuals = [...finalVisuals, ...integratedContent.visuals];
                }

                const mergedContent = {
                    ...integratedContent,
                    classProblems: finalProblems,
                    visuals: finalVisuals
                };
                
                const updatePayload: any = {
                    content: mergedContent,
                };
                
                if (task.fileBase64) {
                    // Get current images
                    const currentImages = targetNote.images || [];
                    updatePayload.images = [...currentImages, task.fileBase64];
                }

                updateNoteContent(targetNote.id, updatePayload); 
            } 
            
            // --- EXECUTE NEW NOTE ---
            else {
                // Import Mode Logic (Text Paste)
                if (task.mode === 'IMPORT') {
                    const contentPayload = await GeminiService.parseRawTextToNote(task.text, task.domain);
                    
                    if (task.customSubtopic) {
                        contentPayload.title = task.customSubtopic;
                        contentPayload.subtopic = "Imported Note";
                    }

                    const newNote: Note = {
                        id: task.id,
                        subjectId: task.subjectId,
                        chapterId: finalChapterId,
                        createdAt: Date.now(),
                        type: NoteType.CONCEPT,
                        domain: task.domain,
                        content: contentPayload,
                        images: []
                    };
                    addNote(newNote);
                    setSelectedNote(newNote);
                }
                
                // Problem Mode Logic
                else if (task.mode === 'PROBLEM') {
                    const problems = await GeminiService.extractProblemsOnly(task.text, task.fileBase64);
                    
                    let contentPayload;
                    if (task.includeAddOn) {
                         contentPayload = await GeminiService.generateNoteFromInput(
                            task.text,
                            task.fileBase64,
                            DetailLevel.EXPANDED,
                            task.domain
                        );
                        contentPayload.classProblems = problems;
                    } else {
                        contentPayload = {
                            title: task.customSubtopic || (task.newChapterTitle || "Problem Set"),
                            subtopic: "Practice",
                            analogy: "N/A",
                            conceptualLogic: "N/A",
                            condensedReview: [],
                            extendedExplanation: "Problem set only.",
                            classProblems: problems,
                            visuals: []
                        };
                    }

                    const newNote: Note = {
                        id: task.id,
                        subjectId: task.subjectId,
                        chapterId: finalChapterId,
                        createdAt: Date.now(),
                        type: task.includeAddOn ? NoteType.MIXED : NoteType.EXAMPLE,
                        domain: task.domain,
                        content: contentPayload,
                        images: task.fileBase64 ? [task.fileBase64] : []
                    };
                    addNote(newNote);
                    setSelectedNote(newNote);
                }
                
                // Concept Mode Logic
                else {
                    const content = await GeminiService.generateNoteFromInput(
                        task.text,
                        task.fileBase64,
                        DetailLevel.EXPANDED,
                        task.domain
                    );
                    
                    // Override Title if Custom Subtopic is provided
                    if (task.customSubtopic) {
                        content.title = task.customSubtopic;
                        content.subtopic = "Manual Entry"; 
                    }
                    
                    if (task.includeAddOn) {
                        const practiceSet = await GeminiService.generatePracticeProblems(content.title, content.extendedExplanation);
                        content.classProblems = [...content.classProblems, practiceSet.easy, practiceSet.medium, practiceSet.hard];
                    }

                    const newNote: Note = {
                        id: task.id,
                        subjectId: task.subjectId,
                        chapterId: finalChapterId,
                        createdAt: Date.now(),
                        type: task.includeAddOn ? NoteType.MIXED : NoteType.CONCEPT,
                        domain: task.domain,
                        content,
                        images: task.fileBase64 ? [task.fileBase64] : []
                    };
                    addNote(newNote);
                    setSelectedNote(newNote);
                }
            }
        }

      } catch (error) {
        console.error("Failed to process task", error);
        // Show specific error if available (e.g. Missing API Key)
        alert(`Failed to generate note: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setCurrentTask(null);
        setBatchCompletedCount(prev => prev + 1);
      }
    };

    processQueue();
  }, [queue, currentTask, addNote, addChapter, setSelectedNote, notes, appendProblemsToNote, updateNoteContent]);

  const addToQueue = (item: QueueItem) => {
    setQueue(prev => [...prev, item]);
    
    if (queue.length === 0 && !currentTask) {
        setBatchCompletedCount(0);
        setBatchTotalCount(1);
    } else {
        setBatchTotalCount(prev => prev + 1);
    }
  };

  return {
    queue,
    currentTask,
    batchCompletedCount,
    batchTotalCount,
    loadingStepText: currentTask?.taskType === 'SUMMARIZE' ? "Compressing Logic..." : LOADING_STEPS[loadingStepIndex],
    addToQueue
  };
};
