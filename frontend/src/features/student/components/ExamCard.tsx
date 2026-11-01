import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { ExamSummaryDTO } from '../types/student.types';
import { ExamMetaInfo } from './ExamMetaInfo';

type ExamCardProps = {
  exam: ExamSummaryDTO;
  statusBadge: React.ReactNode;
};

export const ExamCard: React.FC<ExamCardProps> = ({ exam, statusBadge }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <BookOpen size={24} />
        </div>
        {statusBadge}
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2">{exam.title}</h3>
      <p className="text-sm text-slate-500 mb-4">{exam.subjectName}</p>

      <ExamMetaInfo duration={exam.duration} totalQuestions={exam.totalQuestions} />

      <Link
        to={`/student/exams/${exam.id}`}
        className="w-full flex items-center justify-center py-2.5 px-4 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-xl font-medium transition-colors border border-slate-100 hover:border-indigo-100"
      >
        Xem chi tiết
        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};
