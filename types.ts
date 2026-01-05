
export enum NoteType {
  CONCEPT = 'CONCEPT',
  EXAMPLE = 'EXAMPLE',
  MIXED = 'MIXED'
}

export enum DetailLevel {
  STRICT = 'STRICT', // Scribe mode: Only what is seen
  EXPANDED = 'EXPANDED' // Tutor mode: Adds necessary context
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface UnitStatus {
  safe: boolean;
  warning?: string;
}

export interface Problem {
  id: string;
  question: string;
  given: string[];
  formulas: string[];
  solutionSteps: string[]; // Extended explanation
  solutionMath: string[]; // Just the math
  trick?: string; // Heuristic
  answer: string;
  unitStatus: UnitStatus;
}

export interface NoteContent {
  title: string;
  subtopic: string;
  analogy: string; // Real world analogy
  conceptualLogic: string; // The "Why"
  
  // Content for Condensed Mode (Deprecated in favor of Summary Notebooks, but kept for type safety)
  condensedReview: string[]; 
  
  // Main Content
  extendedExplanation: string; // Deep dive
  
  // Problems associated with this note (from input class)
  classProblems: Problem[];

  // Digitized Vector Graphs (Array of SVG codes)
  visuals: string[];

  // --- NEW: Interactive Editor Content ---
  // Stores the Tiptap JSON structure. If present, this overrides extendedExplanation/conceptualLogic for display.
  editorContent?: any; 
}

export interface Note {
  id: string;
  subjectId: string;
  chapterId: string;
  createdAt: number;
  type: NoteType;
  content: NoteContent;
  images: string[]; // Array of Base64 strings (User uploads)
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  summaryTable?: string; // Markdown table
}

export interface Subject {
  id: string;
  term: string;
  year: string;
  title: string;
  coverImage?: string; // URL for the polaroid cover
  // Summary System
  isSummary?: boolean; // True if this is a summary notebook
  originalSubjectId?: string; // Links back to the parent notebook
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface PracticeProblemSet {
  easy: Problem;
  medium: Problem;
  hard: Problem;
}

export interface QueueItem {
  id: string;
  text: string;
  fileBase64?: string;
  
  // Wizard Configuration
  subjectId: string;
  chapterId: string | 'NEW'; // Can be an existing ID or 'NEW'
  newChapterTitle?: string;  // Required if chapterId is 'NEW'
  
  // Placement Strategy
  targetNoteId?: string;     // If set, force merge into this note
  forceNewNote?: boolean;    // If true, skip AI continuation check and create new
  customSubtopic?: string;   // User-defined title for the new note
  
  mode: 'CONCEPT' | 'PROBLEM';
  includeAddOn: boolean; // Concept: Generate Practice? Problem: Generate Concepts?
  
  // Summarization Task Fields
  taskType?: 'CREATE' | 'SUMMARIZE';
  sourceNote?: Note; // The original note content to summarize
  
  createdAt: number;
}
