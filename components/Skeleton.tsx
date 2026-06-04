
import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`shimmer-bg bg-gray-100 dark:bg-zinc-800 rounded-2xl ${className}`} />
);

export const PetCardSkeleton: React.FC<{ mode: 'list' | 'grid' }> = ({ mode }) => {
  if (mode === 'grid') {
    return (
      <div className="rounded-3xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden animate-pulse">
        <div className="relative pb-[100%] shimmer-bg bg-gray-200 dark:bg-zinc-700" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-[32px] overflow-hidden bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-lg animate-pulse mb-6">
      <div className="relative pb-[125%] shimmer-bg bg-gray-200 dark:bg-zinc-700" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const ChatRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <Skeleton className="w-16 h-16 rounded-[24px]" />
    <div className="flex-1 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-3 w-3/4" />
    </div>
  </div>
);

export const BlockedRowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700 animate-pulse">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="w-20 h-9 rounded-xl" />
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="p-6 space-y-8 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="w-32 h-32 rounded-[48px]" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20 ml-1" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      ))}
    </div>
    <Skeleton className="h-16 w-full rounded-[24px]" />
  </div>
);

export const DetailSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-[55vh] w-full bg-gray-200 dark:bg-zinc-800 shimmer-bg" />
    <div className="px-6 space-y-8 -mt-6 bg-white dark:bg-[#1a1a1a] rounded-t-[40px] pt-8">
      <div className="flex justify-between items-start">
        <div className="space-y-3 w-full">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <Skeleton className="h-14 w-28 rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-36 rounded-[32px]" />
    </div>
  </div>
);
