function SkeletonBar({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/90 ${className}`} />;
}

function AyahCardSkeleton() {
  return (
    <article className="surface-card p-6 sm:p-8" aria-hidden>
      <SkeletonBar className="h-3 w-36" />
      <div className="mt-6 space-y-3">
        <SkeletonBar className="h-4 w-[92%] max-w-xl" />
        <SkeletonBar className="h-4 w-[78%] max-w-lg" />
        <SkeletonBar className="h-4 w-[85%] max-w-2xl" />
      </div>
      <div className="mt-7 space-y-2.5">
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-[94%]" />
        <SkeletonBar className="h-4 w-[72%]" />
      </div>
      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
        <SkeletonBar className="h-2.5 w-28" />
        <div className="mt-3 space-y-2">
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-[88%]" />
        </div>
      </div>
    </article>
  );
}

export default function AyahsLoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <AyahCardSkeleton key={i} />
      ))}
    </div>
  );
}
