import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Home } from 'lucide-react';

const REDIRECT_SECONDS = 5;

const ExamCompleted: React.FC = () => {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          navigate('/student/exams', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [navigate]);

  const handleGoNow = () => {
    navigate('/student/exams', { replace: true });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 md:p-12 shadow-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={34} />
        </div>

        <h1 className="mt-6 text-2xl md:text-3xl font-black text-slate-900">
          Chúc mừng bạn đã hoàn thành bài thi!
        </h1>

        <p className="mt-3 text-slate-600">
          Bạn sẽ được chuyển về trang danh sách bài thi trong{' '}
          <span className="font-bold text-indigo-600">{secondsLeft}</span> giây nữa.
        </p>

        <button
          type="button"
          onClick={handleGoNow}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          <Home size={18} />
          Về trang bài thi ngay
        </button>
      </div>
    </div>
  );
};

export default ExamCompleted;
