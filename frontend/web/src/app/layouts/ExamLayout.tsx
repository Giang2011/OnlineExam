import { Outlet } from 'react-router-dom';

/** Layout riêng cho màn làm bài: cột một, không rail, tối giản. */
export function ExamLayout() {
  return (
    <div className="min-h-screen bg-paper">
      <Outlet />
    </div>
  );
}
