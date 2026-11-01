import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ExamRulesPanel: React.FC = () => {
  return (
    <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
      <h3 className="font-bold text-slate-800 mb-3 flex items-center text-lg">
        <AlertCircle size={20} className="text-amber-500 mr-2" />
        Quy chế thi
      </h3>
      <ul className="space-y-3 text-slate-600 text-sm list-disc list-inside marker:text-indigo-400">
        <li>Bài thi sẽ được đếm ngược ngay sau khi ấn <strong>Bắt đầu</strong>.</li>
        <li>Hệ thống không hỗ trợ tạm dừng. Không đóng trình duyệt trong lúc thi.</li>
        <li>Khi hết thời gian, hệ thống tự động lưu và nộp các câu trả lời hiện có.</li>
        <li>Hãy đảm bảo kết nối ổn định và tập trung trong toàn bộ thời gian làm bài.</li>
      </ul>
    </div>
  );
};
