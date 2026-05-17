function SkeletonBar({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/90 ${className}`} />;
}

function AyahCardSkeleton() {
  return (
    <article className="surface-card p-6 sm:p-8" aria-hidden>
      <SkeletonBar className="h-3 w-36" />
      <div className="mt-6 flex justify-center">
        <SkeletonBar className="h-10 w-[88%] max-w-2xl" />
      </div>
      <div className="mt-7 space-y-2.5">
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-[94%]" />
        <SkeletonBar className="h-4 w-[72%]" />
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
