import React from 'react';
import { X } from 'lucide-react';
import { cleanSvgContent } from '../../utils/helpers';

interface ZoomModalProps {
  content: { type: 'image' | 'svg', data: string } | null;
  onClose: () => void;
}

const ZoomModal: React.FC<ZoomModalProps> = ({ content, onClose }) => {
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[60] flex items-center justify-center p-8 animate-fade-in" onClick={onClose}>
        <button className="absolute top-8 right-8 text-white/50 hover:text-white transition">
            <X className="w-8 h-8" />
        </button>
        <div className="w-full h-full max-w-7xl max-h-screen flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {content.type === 'image' ? (
                 <img src={content.data} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Zoomed" />
            ) : (
                <div className="w-full h-full bg-white rounded-3xl p-8 overflow-auto flex items-center justify-center" dangerouslySetInnerHTML={{ __html: cleanSvgContent(content.data) }} />
            )}
        </div>
    </div>
  );
};

export default ZoomModal;