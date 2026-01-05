
import { Note, Subject, Chapter } from '../types';

const STORAGE_KEY = 'physinote_data_v1';

export interface AppData {
  subjects: Subject[];
  chapters: Chapter[];
  notes: Note[];
}

const DEFAULT_DATA: AppData = {
  subjects: [
    { 
        id: 's1', 
        title: 'MATPY03', 
        year: 'SY 2025-2026', 
        term: 'Term 2', 
        coverImage: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', 
        isSummary: false 
    },
    { 
        id: 's1_sum', 
        title: 'MATPY03', 
        year: 'SY 2025-2026', 
        term: 'Term 2', 
        coverImage: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', 
        isSummary: true, 
        originalSubjectId: 's1' 
    },
    { 
        id: 's2', 
        title: 'MATPY04', 
        year: 'SY 2025-2026', 
        term: 'Term 2',
        coverImage: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        isSummary: false
    },
    { 
        id: 's2_sum', 
        title: 'MATPY04', 
        year: 'SY 2025-2026', 
        term: 'Term 2',
        coverImage: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        isSummary: true,
        originalSubjectId: 's2'
    }
  ],
  chapters: [
    { id: 'c1', subjectId: 's1', title: 'Chapter 1', summaryTable: '' },
    { id: 'c2', subjectId: 's1', title: 'Chapter 2', summaryTable: '' }
  ],
  notes: []
};

export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_DATA;
    
    const parsed = JSON.parse(data);
    
    // --- MIGRATION LOGIC: Convert legacy single-image notes to array format ---
    if (parsed.notes) {
        parsed.notes = parsed.notes.map((note: any) => {
            // 1. Migrate originalImage -> images[]
            let newImages: string[] = note.images || [];
            if (note.originalImage) {
                newImages.push(note.originalImage);
                delete note.originalImage;
            }

            // 2. Migrate digitizedVisual -> visuals[]
            let newVisuals: string[] = note.content.visuals || [];
            if (note.content.digitizedVisual) {
                newVisuals.push(note.content.digitizedVisual);
                delete note.content.digitizedVisual;
            }

            return {
                ...note,
                images: newImages,
                content: {
                    ...note.content,
                    visuals: newVisuals
                }
            };
        });
    }

    return parsed as AppData;
  } catch (error) {
    console.error("Failed to load data", error);
    return DEFAULT_DATA;
  }
};

export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data", error);
  }
};

export const validateData = (data: any): data is AppData => {
  return (
    data && 
    typeof data === 'object' &&
    Array.isArray(data.subjects) && 
    Array.isArray(data.chapters) && 
    Array.isArray(data.notes)
  );
};
