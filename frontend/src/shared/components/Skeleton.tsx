import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={['animate-pulse rounded-xl bg-slate-200', className].join(' ')} />
);

export default Skeleton;
