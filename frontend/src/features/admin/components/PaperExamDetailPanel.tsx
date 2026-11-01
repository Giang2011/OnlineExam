import React from 'react';
import { Link } from 'react-router-dom';
import type { PaperExamDetail } from '../types';

interface PaperExamDetailPanelProps {
  paperExam: PaperExamDetail;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleString('vi-VN');
};

const PaperExamDetailPanel: React.FC<PaperExamDetailPanelProps> = ({ paperExam }) => {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Thông tin chung</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/admin/paper-exams/${paperExam.id}/scan`}
              className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Chấm bằng ảnh
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById('scan-results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Xem lịch sử scan
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2 lg:grid-cols-3">
          <div><span className="font-medium text-slate-900">Tiêu đề:</span> {paperExam.title}</div>
          <div><span className="font-medium text-slate-900">Môn học:</span> {paperExam.subjectName ?? '--'}</div>
          <div><span className="font-medium text-slate-900">Thời lượng:</span> {paperExam.durationMinutes} phút</div>
          <div><span className="font-medium text-slate-900">Tổng số câu:</span> {paperExam.totalQuestions}</div>
          {/* <div><span className="font-medium text-slate-900">Trạng thái:</span> {paperExam.status ?? '--'}</div> */}
          <div><span className="font-medium text-slate-900">Người tạo:</span> {paperExam.createdByName ?? '--'}</div>
          <div><span className="font-medium text-slate-900">Tạo lúc:</span> {formatDateTime(paperExam.createdAt)}</div>
          {/* <div><span className="font-medium text-slate-900">Cập nhật:</span> {formatDateTime(paperExam.updatedAt)}</div> */}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Cấu hình chương</h2>

        {paperExam.chapterConfigs.length === 0 ? (
          <p className="text-sm text-slate-500">Đề giấy này chưa có cấu hình chương.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Chương</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Số câu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paperExam.chapterConfigs.map((config, index) => (
                  <tr key={config.id ?? `${config.chapterId}-${index}`} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{config.chapterName ?? `Chương ${index + 1}`}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{config.questionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default PaperExamDetailPanel;
