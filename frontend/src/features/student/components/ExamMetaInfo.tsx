import React from 'react';
import { Clock, Users } from 'lucide-react';

type ExamMetaInfoProps = {
  duration: number;
  totalQuestions: number;
};

export const ExamMetaInfo: React.FC<ExamMetaInfoProps> = ({ duration, totalQuestions }) => {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center text-sm text-slate-600">
        <Clock size={16} className="mr-2 text-slate-400" />
        Thời gian: <span className="font-semibold ml-1">{duration} phút</span>
      </div>
      <div className="flex items-center text-sm text-slate-600">
        <Users size={16} className="mr-2 text-slate-400" />
        Số câu hỏi: <span className="font-semibold ml-1">{totalQuestions}</span>
      </div>
    </div>
  );
};
