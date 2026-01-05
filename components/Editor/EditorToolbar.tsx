
import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Highlighter, 
  Image as ImageIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Beaker,
  Feather,
  ArrowRight
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  onAiTransform?: (selection: string, instruction: string) => Promise<string>;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onAiTransform }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAiMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return null;
  }

  const Button = ({ onClick, isActive, disabled, children, title }: any) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(e); }} // FIX: Prevent focus loss
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
        isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const src = event.target?.result as string;
              editor.chain().focus().setImage({ src }).run();
          };
          reader.readAsDataURL(file);
      }
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAiAction = async (instruction: string) => {
      if (!onAiTransform || !instruction.trim()) return;
      
      // Check for selection
      const { from, to, empty } = editor.state.selection;
      if (empty) {
          alert("Please highlight the text you want the AI to transform first.");
          setShowAiMenu(false);
          return;
      }

      const selectedText = editor.state.doc.textBetween(from, to);
      
      setAiLoading(true);
      setShowAiMenu(false); // Close menu immediately
      setCustomPrompt(""); // Reset input

      try {
          const result = await onAiTransform(selectedText, instruction);
          if (result) {
              editor.chain().focus().insertContent(result).run();
          }
      } catch (e) {
          console.error(e);
          alert("AI transformation failed. Please try again.");
      } finally {
          setAiLoading(false);
      }
  };

  const AI_SUGGESTIONS = [
      { label: "Fix grammar & spelling", icon: CheckCircle2, prompt: "Fix grammar and spelling errors. Keep the tone academic." },
      { label: "Make it shorter", icon: Minimize2, prompt: "Condense this text. Keep key physics concepts but remove fluff." },
      { label: "Make it longer", icon: Maximize2, prompt: "Expand on this. Explain the physics concepts in more detail." },
      { label: "Make scientific", icon: Beaker, prompt: "Rewrite this using more precise scientific terminology and formal academic tone." },
      { label: "Simplify tone", icon: Feather, prompt: "Simplify the language to be easily understood by a high school student." },
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 mb-4 flex-wrap sticky top-2 z-30 mx-auto max-w-fit">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />

      {/* History */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
          <Button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo className="w-4 h-4" />
          </Button>
          <Button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo className="w-4 h-4" />
          </Button>
      </div>

      {/* Typography */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
          <Button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            isActive={editor.isActive('heading', { level: 1 })}
            title="Large Heading"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            isActive={editor.isActive('heading', { level: 2 })}
            title="Medium Heading"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
      </div>

      {/* Formatting */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
          <Button 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#fbcfe8' }).run()} 
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1 px-1">
             {/* Simple Color Palette */}
             <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor('#1e293b').run()}} className="w-4 h-4 rounded-full bg-slate-800 border border-slate-300 hover:scale-110 transition"></button>
             <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor('#2563eb').run()}} className="w-4 h-4 rounded-full bg-blue-600 border border-slate-300 hover:scale-110 transition"></button>
             <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor('#dc2626').run()}} className="w-4 h-4 rounded-full bg-red-600 border border-slate-300 hover:scale-110 transition"></button>
          </div>
      </div>

      {/* Alignment */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
         <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}><AlignLeft className="w-4 h-4" /></Button>
         <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}><AlignCenter className="w-4 h-4" /></Button>
         <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}><AlignRight className="w-4 h-4" /></Button>
      </div>

      {/* Lists & Media */}
      <div className="flex gap-0.5 border-r border-slate-200 pr-1 mr-1">
          <Button 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </Button>
      </div>

      {/* AI Tool Dropdown */}
      <div className="pl-1 relative" ref={menuRef}>
        <button
            onMouseDown={(e) => { e.preventDefault(); setShowAiMenu(!showAiMenu); }}
            disabled={aiLoading}
            className={`p-2 rounded-lg flex items-center gap-2 font-bold text-xs transition-all ${
                aiLoading 
                ? 'bg-amber-50 text-amber-500 cursor-wait' 
                : 'bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 hover:shadow-md'
            }`}
        >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI
        </button>

        {showAiMenu && (
            <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-slide-down origin-top-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">AI Suggestions</div>
                <div className="space-y-1 mb-3">
                    {AI_SUGGESTIONS.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAiAction(item.prompt)}
                            className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 text-xs font-bold"
                        >
                            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500">
                                <item.icon className="w-3.5 h-3.5" />
                            </div>
                            {item.label}
                        </button>
                    ))}
                </div>
                
                <div className="border-t border-slate-100 pt-3 px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Custom Instruction</label>
                    <div className="flex items-center gap-2">
                        <input 
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiAction(customPrompt)}
                            placeholder="e.g. Translate to Spanish..."
                            className="flex-1 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-200 outline-none"
                            autoFocus
                        />
                        <button 
                            onClick={() => handleAiAction(customPrompt)}
                            disabled={!customPrompt.trim()}
                            className="p-1.5 bg-amber-400 text-amber-900 rounded-lg disabled:opacity-50"
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default EditorToolbar;
