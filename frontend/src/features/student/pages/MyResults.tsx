import React from 'react';
import { Award } from 'lucide-react';
import { useMyResults } from '../hooks/useMyResults';
import { ResultHistoryTable } from '../components';

const MyResults: React.FC = () => {
  const { results, loading, error, refetch } = useMyResults();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Kết quả học tập</h1>
        <p className="text-slate-500 mt-2">Theo dõi tiến độ và lịch sử làm bài</p>
      </div>

      {!!error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Tải lại
          </button>
        </div>
      )}

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Chưa có kết quả</h3>
          <p className="text-slate-500 mt-1">Bạn chưa hoàn thành bất kỳ bài thi nào.</p>
        </div>
      ) : (
        <ResultHistoryTable results={results} />
      )}
    </div>
  );
};

export default MyResults;
