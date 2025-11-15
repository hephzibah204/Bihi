import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const ItemBank = lazy(() => import('./ItemBank'));
const ExamBuilder = lazy(() => import('./ExamBuilder'));
const ExamPlayer = lazy(() => import('./ExamPlayer'));
const ExamTimetable = lazy(() => import('./ExamTimetable'));

const Loader = () => (
  <div className="flex items-center justify-center h-screen">Loading...</div>
);

const CBTRouter = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="items" element={<ItemBank />} />
        <Route path="exams" element={<ExamBuilder />} />
        <Route path="timetable" element={<ExamTimetable />} />
        <Route path="player/:examId" element={<ExamPlayer />} />
        <Route path="*" element={<ItemBank />} />
      </Routes>
    </Suspense>
  );
};

export default CBTRouter;
