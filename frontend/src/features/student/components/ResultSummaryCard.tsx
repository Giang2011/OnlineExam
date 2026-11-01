import React from 'react';
import { Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

type ResultSummaryCardProps = {
  scorePercentage: number;
};

export const ResultSummaryCard: React.FC<ResultSummaryCardProps> = ({ scorePercentage }) => {
  const message =
    scorePercentage >= 80
      ? 'Thật tuyệt vời! Bạn đã hoàn thành bài thi với kết quả xuất sắc.'
      : scorePercentage >= 50
        ? 'Khá tốt! Hãy tiếp tục phát huy ở những bài thi tiếp theo.'
        : 'Cố gắng lên! Bạn cần ôn luyện thêm để đạt kết quả tốt hơn.';

  return (
    <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-200/50 mb-4">
        <Hash size={32} />
      </div>
      <h4 className="text-lg font-black text-indigo-900 tracking-tight">Thành tích của bạn</h4>
      <p className="text-sm text-indigo-700/70 font-medium mt-2 leading-relaxed">{message}</p>
      <div className="mt-8 w-full">
        <Link to="/student/results" className="block w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-[0.12em] rounded-2xl shadow-xl shadow-indigo-200 transition-all text-center">Lịch sử thi</Link>
      </div>
    </div>
  );
};
