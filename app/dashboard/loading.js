import PageSkeletonShell from "@/components/skeletons/PageSkeletonShell";

function SkeletonBar({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/90 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <PageSkeletonShell mainClassName="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <article className="surface-card rounded-3xl p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <SkeletonBar className="h-24 w-24 rounded-full" />
          <div className="w-full flex-1 space-y-3">
            <SkeletonBar className="mx-auto h-7 w-40 sm:mx-0" />
            <SkeletonBar className="mx-auto h-4 w-56 sm:mx-0" />
          </div>
        </div>
      </article>
      <div className="mt-8 grid grid-cols-12 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBar key={i} className="col-span-full h-28 rounded-2xl sm:col-span-6" />
        ))}
      </div>
    </PageSkeletonShell>
  );
}
