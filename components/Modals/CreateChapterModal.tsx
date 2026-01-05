import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChapter: (title: string) => void;
}

const CreateChapterModal: React.FC<CreateChapterModalProps> = ({ isOpen, onClose, onCreateChapter }) => {
  if (!isOpen) return null;
  const [title, setTitle] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 transform transition-all scale-100">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">New Chapter</h3>
           <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition">
             <X className="w-5 h-5" />
           </button>
         </div>
         
         <div className="space-y-5">
           <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Chapter Title</label>
             <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-medium"
                placeholder="e.g. Work and Energy"
             />
           </div>

           <button 
             onClick={() => {
                onCreateChapter(title);
                onClose();
             }}
             disabled={!title}
             className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-4 rounded-full font-bold shadow-xl shadow-slate-200 transition-all mt-2"
           >
             Create Chapter
           </button>
         </div>
      </div>
    </div>
  );
};

export default CreateChapterModal;