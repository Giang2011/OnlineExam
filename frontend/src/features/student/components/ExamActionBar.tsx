import React from 'react';
import { AlertCircle, Play } from 'lucide-react';

type ExamActionBarProps = {
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
};

export const ExamActionBar: React.FC<ExamActionBarProps> = ({ canStart, starting, onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-w-[250px] border-l border-slate-100 pl-8">
      <button
        onClick={onStart}
        disabled={starting || !canStart}
        className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        {starting ? 'Đang khởi tạo...' : (
          <>
            Bắt đầu làm bài <Play size={20} className="ml-2" fill="currentColor" />
          </>
        )}
      </button>
      {!canStart && (
        <p className="text-xs text-red-500 mt-3 font-medium flex items-center">
          <AlertCircle size={14} className="mr-1" />
          Hiện chưa đến thời gian thi
        </p>
      )}
    </div>
  );
};
