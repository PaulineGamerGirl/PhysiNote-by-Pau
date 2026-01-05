import React from 'react';
import { Zap, X, MessageSquare, Send } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';
import { ChatMessage } from '../../types';

interface ChatPanelProps {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  chatHistory: ChatMessage[];
  chatInput: string;
  setChatInput: (input: string) => void;
  handleSendMessage: () => void;
  chatScrollRef: React.RefObject<HTMLDivElement>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isChatOpen,
  setIsChatOpen,
  chatHistory,
  chatInput,
  setChatInput,
  handleSendMessage,
  chatScrollRef
}) => {
  if (!isChatOpen) return null;

  return (
    <div className="fixed right-8 bottom-24 w-[420px] h-[650px] bg-white rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col z-40 animate-slide-up print:hidden overflow-hidden ring-1 ring-black/5">
       <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-xl">
         <h3 className="font-extrabold text-slate-800 flex items-center gap-3">
           <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
             <Zap className="w-4 h-4" />
           </div>
           AI Assistant
         </h3>
         <button onClick={() => setIsChatOpen(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
       </div>
       
       <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]" ref={chatScrollRef}>
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <MessageSquare className="w-10 h-10 text-blue-200" />
              </div>
              <div className="text-center text-sm space-y-1 font-medium">
                <p>Ask me to clarify the derivation,</p>
                <p>check units, or explain the trick.</p>
              </div>
            </div>
          )}
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-3xl px-6 py-4 text-sm shadow-sm leading-relaxed font-medium ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'}`}>
                <MarkdownRenderer content={msg.text} />
              </div>
            </div>
          ))}
       </div>

       <div className="p-5 bg-white border-t border-slate-50">
         <div className="flex items-center gap-2 bg-slate-100 rounded-full px-5 py-3.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all">
           <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about this note..."
            className="bg-transparent flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-400 font-medium"
           />
           <button onClick={handleSendMessage} className={`transition-colors p-1 ${chatInput.trim() ? 'text-blue-600 hover:text-blue-700' : 'text-slate-300'}`}>
             <Send className="w-5 h-5" />
           </button>
         </div>
       </div>
    </div>
  );
};

export default ChatPanel;