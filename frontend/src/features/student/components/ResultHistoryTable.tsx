import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Target } from 'lucide-react';
import type { MyResultDTO } from '../types/student.types';

type ResultHistoryTableProps = {
  results: MyResultDTO[];
};

export const ResultHistoryTable: React.FC<ResultHistoryTableProps> = ({ results }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Kỳ thi</th>
              <th className="px-6 py-4">Kết quả đáp án</th>
              <th className="px-6 py-4">Điểm số / Hạng</th>
              <th className="px-6 py-4">Ngày nộp</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((result) => (
              <tr key={result.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{result.examTitle}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-emerald-600 font-medium">
                    <Target size={16} className="mr-2" />
                    {result.totalCorrect} / {result.totalQuestions} đúng
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-indigo-600 text-lg">{result.score.toFixed(1)} đ</span>
                    {typeof result.rank === 'number' && <span className="text-xs text-slate-500 mt-1">Hạng: #{result.rank}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2" />
                    {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    to={`/student/results/${result.examSessionId}`}
                    className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Chi tiết <ArrowRight size={14} className="ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
