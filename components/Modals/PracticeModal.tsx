import React from 'react';
import { X, Loader2, ChevronRight } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';
import { PracticeProblemSet } from '../../types';

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceProblems: PracticeProblemSet | null;
  generating: boolean;
}

const PracticeModal: React.FC<PracticeModalProps> = ({ isOpen, onClose, practiceProblems, generating }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
           <div>
             <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Practice Problems</h3>
             <p className="text-sm text-slate-500 mt-1 font-medium">AI Generated based on current lesson</p>
           </div>
           <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="overflow-y-auto p-8 space-y-8 bg-[#FAFAFA]">
          {generating ? (
              <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-10 h-10 text-slate-900 animate-spin mb-4" />
                  <p className="text-slate-400 font-medium">Creating Problems...</p>
              </div>
          ) : (
           [practiceProblems?.easy, practiceProblems?.medium, practiceProblems?.hard].map((prob, i) => (
              prob && <div key={i} className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100">
                 <div className="flex items-center gap-3 mb-6">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${i===0?'bg-emerald-50 text-emerald-700':i===1?'bg-blue-50 text-blue-700':'bg-rose-50 text-rose-700'}`}>
                     {i===0?'Level 1: Easy':i===1?'Level 2: Medium':'Level 3: Hard'}
                   </span>
                 </div>
                 <h4 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">{prob.question}</h4>
                 <details className="group">
                   <summary className="cursor-pointer text-blue-600 text-sm font-bold hover:text-blue-800 flex items-center gap-2 bg-blue-50 p-4 rounded-2xl w-fit transition-all hover:bg-blue-100">
                     <span>Reveal Solution</span>
                     <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                   </summary>
                   <div className="mt-6 pl-6 border-l-2 border-slate-100 space-y-6 animate-slide-down">
                      <div className="mb-4 bg-slate-900 text-white p-5 rounded-2xl inline-block shadow-lg shadow-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Final Answer</span>
                        <span className="font-mono text-xl">{prob.answer}</span>
                      </div>
                      <div className="space-y-4 text-slate-700">
                          {prob.solutionSteps.map((step, k) => (
                          <MarkdownRenderer key={k} content={step} />
                          ))}
                      </div>
                   </div>
                 </details>
              </div>
           ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeModal;