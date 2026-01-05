import React, { useEffect } from 'react';
import { FileText, RefreshCw, Layout, Zap } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';
import { Subject, Chapter } from '../../types';

interface SummaryViewProps {
  selectedSubject: Subject | null;
  selectedChapter: Chapter | null;
  handleGenerateCheatSheet: () => void;
  handleUpdateSummary: () => void;
  summaryLoading: boolean;
  onOpenSummarizeModal: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  selectedSubject,
  selectedChapter,
  handleGenerateCheatSheet,
  handleUpdateSummary,
  summaryLoading,
  onOpenSummarizeModal
}) => {
  // Auto-scroll to top when the chapter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedChapter?.id]);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pt-6">
      <header className="mb-10 flex justify-between items-end">
        <div>
          {selectedChapter ? (
            <>
                <div className={`text-xs font-bold mb-2 uppercase tracking-wide ${selectedSubject?.isSummary ? 'text-amber-600' : 'text-slate-400'}`}>
                    {selectedSubject?.isSummary ? 'Summary Deck' : selectedSubject?.title}
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">{selectedChapter.title}</h1>
                <p className="text-slate-500 text-lg font-medium">
                    {selectedSubject?.isSummary ? 'Compressed Review Material' : 'Summary & Master Formulas'}
                </p>
            </>
          ) : (
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Select a Chapter</h1>
          )}
        </div>
        {selectedChapter && (
            <div className="flex gap-3">
                {!selectedSubject?.isSummary && (
                    <button 
                    onClick={onOpenSummarizeModal}
                    className="bg-amber-100 text-amber-800 px-6 py-3 rounded-full text-sm font-bold hover:bg-amber-200 transition shadow-sm flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        Create Summary Deck
                    </button>
                )}
                <button 
                onClick={handleGenerateCheatSheet}
                className="bg-white text-slate-700 px-6 py-3 rounded-full text-sm font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
                >
                    <FileText className="w-4 h-4" />
                    Formula Sheet
                </button>
                <button 
                onClick={handleUpdateSummary}
                disabled={summaryLoading}
                className="bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
                    {summaryLoading ? 'Generating...' : 'Update Table'}
                </button>
            </div>
        )}
      </header>
      
      {selectedChapter && (
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 min-h-[500px]">
            {!selectedChapter.summaryTable ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32">
                <Layout className="w-20 h-20 mb-6 opacity-20" />
                <p className="font-bold text-slate-400 text-lg">No summary generated yet.</p>
                <p className="text-sm mt-2 font-medium text-slate-400">Click "Update Table" to analyze all notes in this chapter.</p>
            </div>
            ) : (
            <MarkdownRenderer content={selectedChapter.summaryTable} />
            )}
        </div>
      )}
    </div>
  );
};

export default SummaryView;