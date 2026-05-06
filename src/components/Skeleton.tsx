function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonPulse
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-md shadow-elevation-1 p-5 ${className}`}>
      {children || (
        <>
          <SkeletonPulse className="h-5 w-2/3 mb-3" />
          <SkeletonPulse className="h-4 w-full mb-2" />
          <SkeletonPulse className="h-4 w-1/2" />
        </>
      )}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 pt-5 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="w-10 h-10 rounded-full" />
      </div>
      <SkeletonPulse className="w-full h-20 rounded-md mb-5" />
      <SkeletonCard className="mb-5 flex justify-center">
        <SkeletonPulse className="w-40 h-40 rounded-full" />
      </SkeletonCard>
      <SkeletonCard className="mb-5">
        <SkeletonPulse className="h-5 w-40 mb-3" />
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <SkeletonPulse key={i} className="w-8 h-8 rounded-full" />
          ))}
        </div>
      </SkeletonCard>
      <SkeletonPulse className="h-6 w-44 mb-3" />
      <div className="flex gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="min-w-[200px] bg-white rounded-md shadow-elevation-1 p-4 flex-shrink-0">
            <SkeletonPulse className="w-full h-24 rounded-sm mb-3" />
            <SkeletonPulse className="h-4 w-3/4 mb-2" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DoseLogSkeleton() {
  return (
    <div className="px-4 pt-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <SkeletonPulse className="h-7 w-32" />
        <SkeletonPulse className="h-9 w-24 rounded-md" />
      </div>
      <div className="flex gap-2 mb-5">
        <SkeletonPulse className="h-8 w-24 rounded-pill" />
        <SkeletonPulse className="h-8 w-24 rounded-pill" />
        <SkeletonPulse className="h-8 w-20 rounded-pill" />
      </div>
      <SkeletonPulse className="h-5 w-28 mb-3" />
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonCard key={i} className="mb-2">
          <div className="flex justify-between">
            <div>
              <SkeletonPulse className="h-4 w-24 mb-2" />
              <SkeletonPulse className="h-3 w-16" />
            </div>
            <SkeletonPulse className="h-3 w-14" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}

export function FoodLogSkeleton() {
  return (
    <div className="px-4 pt-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <SkeletonPulse className="h-7 w-24" />
        <SkeletonPulse className="h-9 w-24 rounded-md" />
      </div>
      <SkeletonPulse className="w-full h-10 rounded-md mb-5" />
      <SkeletonCard className="mb-5">
        <div className="flex justify-between items-end mb-4">
          <div>
            <SkeletonPulse className="h-3 w-14 mb-2" />
            <SkeletonPulse className="h-6 w-24" />
          </div>
          <div className="text-right">
            <SkeletonPulse className="h-3 w-10 mb-2" />
            <SkeletonPulse className="h-5 w-20" />
          </div>
        </div>
        <SkeletonPulse className="h-3 w-28" />
      </SkeletonCard>
      <div className="flex items-center gap-3 mb-5">
        <SkeletonPulse className="h-4 w-16" />
        <div className="flex gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonPulse key={i} className="w-7 h-7 rounded-full" />
          ))}
        </div>
      </div>
      <SkeletonPulse className="h-4 w-20 mb-2" />
      {Array.from({ length: 3 }, (_, i) => (
        <SkeletonCard key={i} className="mb-1">
          <div className="flex justify-between items-center">
            <SkeletonPulse className="h-4 w-28" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}

export function MealPlansSkeleton() {
  return (
    <div className="px-4 pt-5 animate-pulse">
      <SkeletonPulse className="h-7 w-16 mb-4" />
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonPulse key={i} className="h-8 w-28 rounded-pill flex-shrink-0" />
        ))}
      </div>
      <SkeletonPulse className="h-10 w-full rounded-md mb-5" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white rounded-md shadow-elevation-1 overflow-hidden">
            <SkeletonPulse className="w-full h-28" />
            <div className="p-3">
              <SkeletonPulse className="h-4 w-3/4 mb-2" />
              <SkeletonPulse className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProgressSkeleton() {
  return (
    <div className="px-4 pt-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <SkeletonPulse className="h-7 w-24" />
        <SkeletonPulse className="h-9 w-28 rounded-md" />
      </div>
      <SkeletonPulse className="h-10 w-full rounded-md mb-5" />
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          <SkeletonPulse className="h-8 w-20 rounded-pill" />
          <SkeletonPulse className="h-8 w-20 rounded-pill" />
          <SkeletonPulse className="h-8 w-16 rounded-pill" />
        </div>
        <SkeletonPulse className="h-7 w-16 rounded-md" />
      </div>
      <SkeletonCard className="mb-5">
        <SkeletonPulse className="w-full h-32 rounded-md" />
      </SkeletonCard>
      <SkeletonPulse className="h-4 w-16 mb-3" />
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonCard key={i} className="mb-2">
          <div className="flex justify-between items-center">
            <SkeletonPulse className="h-4 w-16" />
            <div className="flex gap-4">
              <SkeletonPulse className="h-3 w-14" />
              <SkeletonPulse className="h-3 w-12" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="px-4 pt-5 animate-pulse">
      <SkeletonPulse className="h-7 w-16 mb-5" />
      <SkeletonCard className="mb-4">
        <div className="flex items-center gap-4">
          <SkeletonPulse className="w-14 h-14 rounded-full" />
          <div>
            <SkeletonPulse className="h-5 w-28 mb-2" />
            <SkeletonPulse className="h-3 w-40" />
          </div>
        </div>
      </SkeletonCard>
      <SkeletonCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <SkeletonPulse className="h-4 w-36 mb-2" />
            <SkeletonPulse className="h-3 w-28" />
          </div>
          <SkeletonPulse className="h-9 w-14 rounded-md" />
        </div>
      </SkeletonCard>
      <SkeletonCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <SkeletonPulse className="h-4 w-28 mb-2" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
          <SkeletonPulse className="h-9 w-20 rounded-md" />
        </div>
      </SkeletonCard>
      <SkeletonCard className="mb-4">
        <SkeletonPulse className="h-4 w-24 mb-3" />
        <SkeletonPulse className="h-4 w-36 mb-2" />
        <SkeletonPulse className="h-4 w-28" />
      </SkeletonCard>
      <SkeletonPulse className="w-full h-12 rounded-md" />
    </div>
  )
}
