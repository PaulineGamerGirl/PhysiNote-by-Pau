import React from 'react';
import { Loader2 } from 'lucide-react';
import { QueueItem } from '../../types';

interface FloatingQueueProps {
  currentTask: QueueItem | null;
  queueLength: number;
  batchCompletedCount: number;
  batchTotalCount: number;
  loadingStepText: string;
}

const FloatingQueue: React.FC<FloatingQueueProps> = ({
  currentTask,
  queueLength,
  batchCompletedCount,
  batchTotalCount,
  loadingStepText
}) => {
  if (!currentTask && queueLength === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 bg-white rounded-2xl shadow-2xl p-6 w-80 animate-slide-up border border-slate-100 ring-1 ring-black/5">
       <div className="flex items-start gap-4">
          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 flex-shrink-0">
              <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="flex-1">
             <h4 className="font-bold text-slate-900 text-sm mb-1">Processing Notes</h4>
             <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-3">
                <span>Task {batchCompletedCount + 1} of {batchTotalCount}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{Math.round(((batchCompletedCount) / batchTotalCount) * 100)}%</span>
             </div>
             <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${((batchCompletedCount) / batchTotalCount) * 100}%` }}></div>
             </div>
             <p className="text-xs text-slate-400 truncate animate-pulse">{loadingStepText}</p>
          </div>
       </div>
    </div>
  );
};

export default FloatingQueue;