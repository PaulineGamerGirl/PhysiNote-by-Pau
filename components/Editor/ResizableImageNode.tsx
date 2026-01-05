
import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { AlignLeft, AlignCenter, Maximize, Move } from 'lucide-react';

export const ResizableImageNode = (props: any) => {
  const { node, updateAttributes, selected } = props;
  const [isResizing, setIsResizing] = useState(false);
  
  // Default dimensions if not set
  const width = node.attrs.width || '100%';
  const height = node.attrs.height || 'auto';
  const layout = node.attrs.layout || 'center'; // 'center' | 'float-left'

  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = (
    e: React.MouseEvent, 
    direction: 'width' | 'height' | 'both'
  ) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = containerRef.current?.offsetWidth || 0;
    const startHeight = containerRef.current?.offsetHeight || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newAttrs: any = {};

      if (direction === 'width' || direction === 'both') {
        newAttrs.width = `${Math.max(100, startWidth + deltaX)}px`;
      }
      
      if (direction === 'height' || direction === 'both') {
        // If we modify height explicitly, we enable the "crop" (object-fit: cover) behavior
        newAttrs.height = `${Math.max(100, startHeight + deltaY)}px`;
      }

      updateAttributes(newAttrs);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const toggleLayout = () => {
    updateAttributes({
      layout: layout === 'center' ? 'float-left' : 'center'
    });
  };

  return (
    <NodeViewWrapper 
      className={`resizable-image-wrapper ${selected ? 'ProseMirror-selectednode' : ''}`}
      style={{
        display: layout === 'center' ? 'flex' : 'inline-block',
        justifyContent: 'center',
        float: layout === 'float-left' ? 'left' : 'none',
        marginRight: layout === 'float-left' ? '24px' : '0',
        marginBottom: '24px',
        maxWidth: '100%',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: width,
          height: height === 'auto' ? 'auto' : height,
          position: 'relative',
          maxWidth: '100%',
          overflow: 'hidden', // This enables the "crop" look
          borderRadius: '12px',
          boxShadow: selected ? '0 0 0 3px #3b82f6' : 'none',
          transition: isResizing ? 'none' : 'box-shadow 0.2s'
        }}
        className="group"
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Ensures image fills container without distortion (crops)
            display: 'block'
          }}
        />

        {/* --- Toolbar (Visible on Select/Hover) --- */}
        <div className={`absolute top-2 right-2 flex gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 opacity-0 transition-opacity ${selected || isResizing ? 'opacity-100' : 'group-hover:opacity-100'}`}>
            <button 
                onClick={toggleLayout}
                className="p-1.5 text-white hover:bg-white/20 rounded-md transition"
                title={layout === 'center' ? "Switch to Text Wrap (Float Left)" : "Switch to Centered Block"}
            >
                {layout === 'center' ? <AlignLeft className="w-4 h-4" /> : <AlignCenter className="w-4 h-4" />}
            </button>
        </div>
        
        {/* --- Resize Handles --- */}
        {(selected || isResizing) && (
            <>
                {/* Right Handle (Width Only) */}
                <div 
                    onMouseDown={(e) => handleResizeStart(e, 'width')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 bg-white/80 border border-slate-300 rounded-full cursor-ew-resize flex items-center justify-center opacity-80 hover:opacity-100 z-20 shadow-sm translate-x-1/2"
                >
                    <div className="w-0.5 h-4 bg-slate-400 rounded-full"></div>
                </div>

                {/* Bottom Handle (Height Only) */}
                <div 
                    onMouseDown={(e) => handleResizeStart(e, 'height')}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-4 w-12 bg-white/80 border border-slate-300 rounded-full cursor-ns-resize flex items-center justify-center opacity-80 hover:opacity-100 z-20 shadow-sm translate-y-1/2"
                >
                    <div className="h-0.5 w-4 bg-slate-400 rounded-full"></div>
                </div>

                {/* Corner Handle (Both) */}
                <div 
                    onMouseDown={(e) => handleResizeStart(e, 'both')}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full cursor-nwse-resize shadow-lg z-30 border-2 border-white translate-x-1/3 translate-y-1/3 hover:scale-110 transition-transform flex items-center justify-center"
                >
                    <Maximize className="w-3 h-3 text-white" />
                </div>
            </>
        )}
      </div>
    </NodeViewWrapper>
  );
};
