
import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, Sparkles } from 'lucide-react';
import * as GeminiService from '../../services/geminiService';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubject: (title: string, term: string, year: string, initialStructure: { title: string, subtopics: string[] }[]) => void;
}

const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({ isOpen, onClose, onCreateSubject }) => {
  if (!isOpen) return null;
  const [title, setTitle] = useState('');
  const [term, setTerm] = useState('');
  const [year, setYear] = useState('');
  
  // Syllabus State
  const [useSyllabus, setUseSyllabus] = useState(false);
  const [syllabusText, setSyllabusText] = useState('');
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!title) return;

    if (useSyllabus && (syllabusText || syllabusFile)) {
        setIsProcessing(true);
        try {
            let base64 = undefined;
            if (syllabusFile) {
                const reader = new FileReader();
                base64 = await new Promise<string>((resolve) => {
                    reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                    reader.readAsDataURL(syllabusFile);
                });
            }

            const structure = await GeminiService.parseSyllabusToChapters(syllabusText, base64);
            onCreateSubject(title, term, year, structure);
        } catch (e) {
            console.error(e);
            alert("Failed to parse syllabus. Created empty notebook instead.");
            onCreateSubject(title, term, year, []);
        } finally {
            setIsProcessing(false);
            onClose();
        }
    } else {
        onCreateSubject(title, term, year, []);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 transform transition-all scale-100 relative overflow-hidden">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">New Notebook</h3>
           <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition">
             <X className="w-5 h-5" />
           </button>
         </div>
         
         <div className="space-y-5">
           {/* Basic Info */}
           <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject Title</label>
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-medium"
                        placeholder="e.g. Classical Mechanics"
                    />
               </div>
               <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Term</label>
                    <input 
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-medium"
                        placeholder="e.g. Fall 2024"
                    />
               </div>
               <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Year</label>
                    <input 
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-medium"
                        placeholder="e.g. Sophomore"
                    />
               </div>
           </div>

           {/* Syllabus Toggle */}
           <div className="border-t border-slate-100 pt-5 mt-2">
               <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                       <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                           <Sparkles className="w-4 h-4" />
                       </div>
                       <span className="font-bold text-slate-700 text-sm">Auto-generate chapters & notes?</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={useSyllabus} onChange={(e) => setUseSyllabus(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
               </div>

               {useSyllabus && (
                   <div className="animate-slide-down space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Paste Syllabus Text</label>
                            <textarea 
                                value={syllabusText}
                                onChange={(e) => setSyllabusText(e.target.value)}
                                className="w-full bg-white border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 h-20 resize-none font-medium text-slate-700"
                                placeholder="Paste the course outline here..."
                            />
                       </div>
                       <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Or Upload Image</label>
                            <div className="flex items-center gap-3">
                                <label className="flex-1 cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    {syllabusFile ? "Change File" : "Choose File"}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)} />
                                </label>
                                {syllabusFile && <span className="text-xs font-medium text-slate-500 truncate max-w-[100px]">{syllabusFile.name}</span>}
                            </div>
                       </div>
                   </div>
               )}
           </div>

           <button 
             onClick={handleSubmit}
             disabled={!title || isProcessing}
             className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-4 rounded-full font-bold shadow-xl shadow-slate-200 transition-all mt-2 flex items-center justify-center gap-2"
           >
             {isProcessing ? (
                 <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Syllabus...</span>
                 </>
             ) : (
                 "Create Notebook"
             )}
           </button>
         </div>
      </div>
    </div>
  );
};

export default CreateSubjectModal;
