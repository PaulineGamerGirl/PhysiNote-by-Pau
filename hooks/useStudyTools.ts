import { useState } from 'react';
import { Note, Chapter, PracticeProblemSet } from '../types';
import * as GeminiService from '../services/geminiService';

export const useStudyTools = (
    notes: Note[], 
    updateChapterSummary: (id: string, summary: string) => void
) => {
  const [practiceProblems, setPracticeProblems] = useState<PracticeProblemSet | null>(null);
  const [generatingPractice, setGeneratingPractice] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [cheatSheetContent, setCheatSheetContent] = useState<string>('');

  const generatePractice = async (note: Note) => {
    setGeneratingPractice(true);
    try {
      const context = JSON.stringify(note.content.extendedExplanation);
      const problems = await GeminiService.generatePracticeProblems(note.content.title, context);
      setPracticeProblems(problems);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPractice(false);
    }
  };

  const updateSummary = async (chapter: Chapter) => {
    setSummaryLoading(true);
    const chapterNotes = notes.filter(n => n.chapterId === chapter.id);
    const notesText = chapterNotes.map(n => 
      `Title: ${n.content.title}\nConcept: ${n.content.conceptualLogic}\nFormulas: ${n.content.condensedReview.join('; ')}`
    );
    
    try {
      const summary = await GeminiService.generateSummaryTable(notesText);
      updateChapterSummary(chapter.id, summary);
    } catch(e) {
      console.error(e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const generateCheatSheet = async (chapter: Chapter) => {
    setSummaryLoading(true);
    const chapterNotes = notes.filter(n => n.chapterId === chapter.id);
    const notesText = chapterNotes.map(n => 
        `Title: ${n.content.title}\nConcept: ${n.content.conceptualLogic}\nFormulas: ${n.content.condensedReview.join('; ')}`
      );
    
    try {
        const sheet = await GeminiService.generateFormulaCheatSheet(notesText);
        setCheatSheetContent(sheet);
    } catch(e) {
        console.error(e);
    } finally {
        setSummaryLoading(false);
    }
  };

  return {
      practiceProblems,
      generatingPractice,
      generatePractice,
      summaryLoading,
      updateSummary,
      cheatSheetContent,
      generateCheatSheet
  };
};