
import { GoogleGenAI, Schema, Type, FunctionDeclaration } from "@google/genai";
import { NoteContent, NoteType, PracticeProblemSet, DetailLevel, Problem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

const UnitStatusSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    safe: { type: Type.BOOLEAN, description: "True if all units in 'Given' are consistent (SI or compatible). False if conversion is required (e.g. cm to m)." },
    warning: { type: Type.STRING, description: "Short warning message if unsafe, e.g. 'Convert cm to m'." }
  },
  required: ["safe"]
};

const ProblemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    given: { type: Type.ARRAY, items: { type: Type.STRING } },
    formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
    solutionSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step by step with full textual explanation" },
    solutionMath: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Just the LaTeX math steps" },
    trick: { type: Type.STRING, description: "Heuristic or shortcut to solve this type of problem" },
    answer: { type: Type.STRING, description: "Final answer with units" },
    unitStatus: UnitStatusSchema
  },
  required: ["question", "given", "formulas", "solutionSteps", "solutionMath", "answer", "unitStatus"]
};

const ProblemsOnlySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    problems: { type: Type.ARRAY, items: ProblemSchema }
  },
  required: ["problems"]
};

const NoteResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subtopic: { type: Type.STRING },
    analogy: { type: Type.STRING, description: "1-2 lines connecting abstract physics to reality" },
    conceptualLogic: { type: Type.STRING, description: "The 'why' before the 'how'" },
    condensedReview: { type: Type.ARRAY, items: { type: Type.STRING }, description: "High-yield bullet points for cramming" },
    extendedExplanation: { type: Type.STRING, description: "Deep dive derivation and context in Markdown/LaTeX" },
    classProblems: { type: Type.ARRAY, items: ProblemSchema },
    visuals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of SVG strings. If input has a graph/diagram, generate a clean minimalist SVG (<svg>...</svg>). If no visual, return empty array." }
  },
  required: ["title", "subtopic", "analogy", "conceptualLogic", "condensedReview", "extendedExplanation", "classProblems", "visuals"]
};

const ContextMatchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    matchFound: { type: Type.BOOLEAN },
    matchedNoteId: { type: Type.STRING, description: "The ID of the note that matches the input content." },
    reasoning: { type: Type.STRING, description: "Why this input belongs to this note." },
    suggestedTitle: { type: Type.STRING, description: "If no match found, a suggested title for a new note." }
  },
  required: ["matchFound"]
};

const ContinuationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isContinuation: { type: Type.BOOLEAN, description: "True if the new input is a direct continuation (part 2, next slide, same derivation) of the previous note." },
    reasoning: { type: Type.STRING }
  },
  required: ["isContinuation"]
};

const PracticeSetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    easy: ProblemSchema,
    medium: ProblemSchema,
    hard: ProblemSchema
  },
  required: ["easy", "medium", "hard"]
};

const SyllabusSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    modules: { 
        type: Type.ARRAY, 
        items: { 
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Chapter Title (e.g., 'Kinematics')" },
                subtopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of explicit subtopics (e.g., 'Velocity', 'Acceleration')" }
            },
            required: ["title", "subtopics"]
        },
        description: "List of modules/chapters found in the syllabus" 
    }
  },
  required: ["modules"]
};

const updateNoteTool: FunctionDeclaration = {
  name: "update_note",
  description: "Updates the current note content. Use this tool when the user asks to edit, rewrite, delete, or add content to the note. You must provide the FULL updated NoteContent object.",
  parameters: NoteResponseSchema
};


// --- API Calls ---

export const summarizeNoteContent = async (originalNote: NoteContent): Promise<NoteContent> => {
    const prompt = `
      Task: Create a "Summarized/Cheat Sheet" version of this physics note.
      
      Input Content:
      ${JSON.stringify(originalNote)}
  
      Rules for Summarization:
      1. Title & Subtopic: Keep identical.
      2. Conceptual Logic: Compress to 1-2 lines maximum. Just the core intuition.
      3. Analogy: Keep if short, otherwise remove (N/A).
      4. Extended Explanation: EMPTY string. Do not include long derivations.
      5. Condensed Review: Keep only the most critical formulas/definitions.
      6. Problems: 
         - Keep the Question.
         - Keep the Math Solution (LaTeX).
         - REMOVE the text-based explanation steps. Just the math.
      7. Visuals: Return empty array.
      
      Output strictly JSON matching the schema.
    `;
  
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash is good for summarization
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: NoteResponseSchema,
      }
    });
  
    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text) as NoteContent;
};

export const analyzeContinuation = async (
  textInput: string,
  imageBase64: string | undefined,
  previousNoteContent: NoteContent
): Promise<{ isContinuation: boolean; reasoning?: string }> => {
  const prompt = `
    Compare the New Input with the Previous Note Content.
    
    Previous Note Context:
    Title: ${previousNoteContent.title}
    Subtopic: ${previousNoteContent.subtopic}
    Last few lines of explanation: ${previousNoteContent.extendedExplanation.slice(-300)}

    Task:
    Determine if the "New Input" is a DIRECT CONTINUATION of the "Previous Note".
    
    Return TRUE if:
    - It is the next slide of the same specific lecture topic.
    - It is a continuation of a math derivation started in the previous note.
    - It adds more details/diagrams to the *exact same* subtopic.
    
    Return FALSE if:
    - It is a completely new subtopic (e.g. moved from Velocity to Acceleration).
    - It is a new Example Problem that stands alone.
    - The content is unrelated.
  `;

  const parts: any[] = [{ text: prompt }];
  if (textInput) parts.push({ text: `New Input Text: ${textInput}` });
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: ContinuationSchema
    }
  });

  if (!response.text) return { isContinuation: false };
  return JSON.parse(response.text);
};

export const parseSyllabusToChapters = async (
    textInput: string,
    imageBase64: string | undefined
): Promise<{ title: string; subtopics: string[] }[]> => {
    const prompt = `
      Analyze the provided syllabus or course outline.
      Extract a structured list of the main Chapters/Modules AND their explicit subtopics.
      If subtopics are not explicitly listed, try to infer main key concepts as subtopics.
      
      Output Format:
      [{ title: "Chapter 1", subtopics: ["Topic A", "Topic B"] }, ...]
    `;

    const parts: any[] = [{ text: prompt }];
    if (textInput) parts.push({ text: `Syllabus Text: ${textInput}` });
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
    }

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: SyllabusSchema
        }
    });

    if (!response.text) return [];
    const result = JSON.parse(response.text);
    return result.modules || [];
};

export const extractProblemsOnly = async (
  textInput: string,
  imageBase64: string | undefined
): Promise<Problem[]> => {
  const prompt = `
    Extract ONLY the physics problems from this input.
    Do NOT generate analogies, conceptual logic, or summaries.
    Focus strictly on parsing the Question, Given values, Formulas needed, and the Step-by-Step Solution.
    Format math with LaTeX.
  `;

  const parts: any[] = [{ text: prompt }];
  if (textInput) parts.push({ text: `Input Text: ${textInput}` });
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: ProblemsOnlySchema
    }
  });

  if (!response.text) throw new Error("No response");
  const result = JSON.parse(response.text);
  return result.problems || [];
};

export const generateNoteFromInput = async (
  textInput: string,
  imageBase64: string | undefined,
  detailLevel: DetailLevel,
  previousNoteContext?: string,
  excludeProblems: boolean = false,
  excludeConcepts: boolean = false
): Promise<NoteContent> => {
  
  const detailInstruction = detailLevel === DetailLevel.STRICT 
    ? "MODE: STRICT SCRIBE. \nConstraint: Do NOT add external knowledge. Polished version of input only."
    : "MODE: EXPANDED TUTOR. \nConstraint: Provide necessary context to make the concept clear.";

  const contextInstruction = previousNoteContext 
    ? `PREVIOUS NOTE CONTEXT: ${previousNoteContext.substring(0, 500)}... \nEnsure coherence. Do not repeat basic definitions.`
    : "No previous context. Treat this as the start of a new topic.";
    
  let exclusionInstruction = "";
  if (excludeProblems) {
      exclusionInstruction += "CRITICAL: Do NOT extract or generate any 'classProblems'. Leave the array empty. Focus ONLY on concepts/definitions.\n";
  }
  if (excludeConcepts) {
      exclusionInstruction += "CRITICAL: Do NOT generate 'analogy', 'conceptualLogic' or 'extendedExplanation'. Fill them with 'N/A' or simple placeholders. Focus ONLY on the problems.\n";
  }

  const prompt = `
    You are an expert Physics Assistant. 
    Analyze the provided input (slide, blackboard, handwritten notes).
    
    ${detailInstruction}
    ${contextInstruction}
    ${exclusionInstruction}
    
    Requirements:
    1. Identify Main Lesson/Subtopic.
    2. Real World Analogy (1-2 lines).
    3. Conceptual Logic (The 'Why').
    4. Core Content:
       - Condensed Review: Key bullets.
       - Extended Explanation: Markdown/LaTeX text.
    5. Extract 'classProblems' if found (unless instructed otherwise).
       - Analyze 'Given', 'Formulas', 'Tricks', solutions.
       - Check UNIT CONSISTENCY (set unitStatus.safe).
       - USE LATEX for math ($...$ or $$...$$).
    6. GRAPH/DIAGRAM DIGITIZER: If input has a diagram, generate semantic SVG code in 'visuals' array.
  `;

  const parts: any[] = [{ text: prompt }];
  if (textInput) parts.push({ text: `Additional User Notes: ${textInput}` });
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview", // Using Pro for complex reasoning/vision
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: NoteResponseSchema,
      systemInstruction: "You are a specialized Physics Assistant. Output valid JSON. Ensure LaTeX backslashes are escaped properly for JSON string format. For SVGs, ensure they are self-contained.",
      thinkingConfig: { thinkingBudget: 2048 } // Enable thinking for better derivations
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text) as NoteContent;
};

// --- NEW: Smart Integration ---
export const integrateNoteContent = async (
  currentContent: NoteContent,
  newInputText: string,
  newInputImage: string | undefined
): Promise<NoteContent> => {
  const prompt = `
    You are a Senior Technical Editor and Physics Tutor.
    
    Task: INTEGRATE new content into an existing note to create a single, cohesive document.
    
    EXISTING NOTE:
    ${JSON.stringify(currentContent)}
    
    NEW INPUT INSTRUCTIONS:
    ${newInputText}
    
    Rules for Integration:
    1. TEXT (extendedExplanation, conceptualLogic, analogy):
       - Do NOT just append the new text to the end.
       - REWRITE the content to weave the new information in naturally.
       - If the new input clarifies a concept mentioned earlier, update the earlier section.
       - If it adds a new step to a derivation, insert it in the correct logical order.
       - Ensure the tone is consistent.
       
    2. PRESERVATION:
       - Do NOT change the 'title' or 'subtopic' unless the new input explicitly says "Change topic to X". The user may have manually set these.
       
    3. PROBLEMS (classProblems):
       - EXTRACT ONLY THE *NEW* PROBLEMS found in the input.
       - Do NOT include the old problems in the output JSON (the system handles merging to prevent duplication).
       - Return an array containing ONLY the problems found in this specific new input/image.
       
    4. VISUALS (visuals):
       - If the new input contains a diagram, generate a new SVG and add it to the array.
       - Return an array containing ONLY the NEW visuals found in this input.

    Output valid JSON matching the schema.
  `;

  const parts: any[] = [{ text: prompt }];
  if (newInputImage) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: newInputImage
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview", // Pro model required for complex editing tasks
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: NoteResponseSchema,
      systemInstruction: "You are an expert editor. Output valid JSON. Prioritize coherence and flow.",
      thinkingConfig: { thinkingBudget: 4096 } // Higher budget for careful rewriting
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text) as NoteContent;
};

export const generatePracticeProblems = async (
  topic: string,
  context: string
): Promise<PracticeProblemSet> => {
  const prompt = `
    Generate 3 practice physics problems for the topic: "${topic}".
    Context from notes: ${context}

    1. Easy: Mechanical, shows steps immediately.
    2. Medium: Exam-standard difficulty.
    3. Hard: Cumulative/Integrative (combines current topic with previous physics concepts).

    Include specific 'Tricks' for solving them effectively.
    Analyze unit consistency for each problem.
    Use LaTeX for math.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: PracticeSetSchema,
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text) as PracticeProblemSet;
};

export const generateSummaryTable = async (
  notesContent: string[]
): Promise<string> => {
  const prompt = `
    Create a Master Summary Table for this chapter based on the following notes content.
    Include columns for: Concept/Quantity, Symbol, Formula, SI Unit, and Key Insight.
    Output in Markdown Table format.
    
    Notes Content:
    ${notesContent.join("\n\n---\n\n")}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "";
};

export const generateFormulaCheatSheet = async (
  notesContent: string[]
): Promise<string> => {
  const prompt = `
    Create a Formula Cheat Sheet for the following physics notes.
    Group formulas by sub-topic.
    For each formula, list:
    - The LaTeX equation
    - Variable definitions
    - SI Units
    - Common constants used
    
    Format nicely in Markdown with headers.
    
    Notes Content:
    ${notesContent.join("\n\n---\n\n")}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "";
}

export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  currentNoteContext: string
): Promise<{ text: string; updatedNote?: NoteContent }> => {
  
  const systemContext = `
    You are a Physics AI Assistant embedded in a note-taking app.
    The user is currently looking at a note with the following JSON content:
    ${currentNoteContext}
    
    Your Capabilities:
    1. Answer questions about the note (clarifications, definitions, etc.).
    2. EDIT the note if requested (e.g., "Remove the second problem", "Rewrite the analogy", "Add a section about torque").
    
    Rules for Editing:
    - If the user asks to change the note, you MUST call the 'update_note' tool.
    - When calling 'update_note', you must return the COMPLETE NoteContent object, merging the user's changes into the existing content.
    - Do not lose existing data (like diagrams or problems) unless explicitly asked to remove them.
    - Ensure the 'type' of the note remains consistent unless asked to change.
    - Use LaTeX for math.
  `;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: { 
        systemInstruction: systemContext,
        tools: [{ functionDeclarations: [updateNoteTool] }]
    },
    history: history as any
  });

  const result = await chat.sendMessage({ message: newMessage });
  
  let updatedNote: NoteContent | undefined;
  const calls = result.functionCalls;
  
  if (calls && calls.length > 0) {
      const call = calls[0];
      if (call.name === "update_note") {
          updatedNote = call.args as unknown as NoteContent;
      }
  }

  const text = result.text || "Note updated successfully.";

  return { text, updatedNote };
};

// --- NEW: Editor Transformation Tool ---
export const transformSelectedText = async (
    selectedText: string, 
    instruction: string
): Promise<string> => {
    const prompt = `
      You are a specialized Physics Editor.
      Task: Transform the selected text based on the user's instruction.
      
      User Instruction: "${instruction}"
      Selected Text: "${selectedText}"
      
      Rules:
      1. ONLY return the transformed text. Do not add conversational filler ("Here is the corrected text...").
      2. Maintain the physics context and accuracy.
      3. If the user asks to "fix grammar", make it professional and academic.
      4. If the user asks to "expand", add relevant physics details but keep it concise.
      5. Use LaTeX ($...$) for any math variables.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
    });

    return response.text || selectedText;
};
    