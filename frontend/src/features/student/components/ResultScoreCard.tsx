import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { SessionResultDTO } from '../types/student.types';

type ResultScoreCardProps = {
  result: SessionResultDTO;
  scorePercentage: number;
};

export const ResultScoreCard: React.FC<ResultScoreCardProps> = ({ result, scorePercentage }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Điểm số</p>
          <div className="text-5xl font-black text-white flex items-baseline gap-2">
            {result.score.toFixed(2)}
            <span className="text-white/30 text-xl">/ 10</span>
          </div>
        </div>
        <div className="w-20 h-20 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226.1} strokeDashoffset={226.1 - (226.1 * scorePercentage) / 100} className="text-indigo-400" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
            {scorePercentage}%
          </div>
        </div>
      </div>

      <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-3">
          <CheckCircle2 size={24} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đúng / Tổng</p>
        <div className="text-2xl font-black text-slate-900 mt-1">
          {result.totalCorrect} <span className="text-slate-300 mx-1">/</span> {result.totalQuestions}
        </div>
      </div>
    </div>
  );
};
