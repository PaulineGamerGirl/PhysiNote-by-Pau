
import React, { useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import EditorToolbar from './EditorToolbar';
import { ResizableImageNode } from './ResizableImageNode';

// Define Custom Image Extension
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
           width: attributes.width
        }),
      },
      height: {
        default: 'auto',
        renderHTML: attributes => ({
           height: attributes.height
        }),
      },
      layout: {
        default: 'center', // 'center' | 'float-left'
        renderHTML: attributes => ({
           'data-layout': attributes.layout,
           style: attributes.layout === 'float-left' ? 'float: left; margin-right: 24px; margin-bottom: 24px;' : ''
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode);
  },
});

interface InteractiveEditorProps {
  initialContent: any; // JSON or HTML
  onUpdate: (json: any) => void;
  isEditable?: boolean;
  onAiTransform?: (selection: string, instruction: string) => Promise<string>;
}

const InteractiveEditor: React.FC<InteractiveEditorProps> = ({ 
  initialContent, 
  onUpdate,
  isEditable = true,
  onAiTransform
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
            levels: [1, 2, 3]
        }
      }),
      CustomImage.configure({
        inline: true, // Needed for float to work properly in some contexts
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
          multicolor: true
      })
    ],
    content: initialContent,
    editable: isEditable,
    editorProps: {
        attributes: {
            class: 'notebook-editor focus:outline-none min-h-[500px] pb-20',
        }
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
  });

  // Handle external content updates
  useEffect(() => {
      if (editor && initialContent) {
          // Logic to handle external updates if necessary
      }
  }, [initialContent, editor]);

  return (
    <div className="relative w-full">
      {isEditable && <EditorToolbar editor={editor} onAiTransform={onAiTransform} />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default InteractiveEditor;
