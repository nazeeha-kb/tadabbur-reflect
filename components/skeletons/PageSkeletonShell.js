import SiteHeader from "@/components/SiteHeader";

function SkeletonBar({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/90 ${className}`} />;
}

export default function PageSkeletonShell({ children, mainClassName = "mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6" }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className={mainClassName}>{children}</main>
    </div>
  );
}

export function ReflectResultsPageSkeleton() {
  return (
    <PageSkeletonShell>
      <SkeletonBar className="h-3 w-32" />
      <SkeletonBar className="mt-4 h-14 w-full max-w-xl" />
      <SkeletonBar className="mt-3 h-4 w-56" />
      <div className="mt-8 space-y-6">
        {[0, 1, 2].map((i) => (
          <article key={i} className="surface-card space-y-4 p-6 sm:p-8">
            <SkeletonBar className="h-3 w-28" />
            <SkeletonBar className="ml-auto h-10 w-full max-w-md" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-[90%]" />
            <SkeletonBar className="h-4 w-[75%]" />
          </article>
        ))}
      </div>
    </PageSkeletonShell>
  );
}

export function ReflectAyahPageSkeleton() {
  return (
    <PageSkeletonShell>
      <SkeletonBar className="h-4 w-16" />
      <article className="surface-card mt-6 space-y-4 p-6 sm:p-8">
        <SkeletonBar className="h-3 w-28" />
        <SkeletonBar className="ml-auto h-10 w-full max-w-md" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-[88%]" />
      </article>
      <article className="paper-bg mt-12 space-y-4 rounded-3xl border border-[#d2c8b9] p-6 sm:p-8">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-32 w-full" />
      </article>
    </PageSkeletonShell>
  );
}

export function ReflectionsListPageSkeleton() {
  return (
    <PageSkeletonShell mainClassName="mx-auto w-full max-w-6xl px-4 pb-16 pt-20 sm:px-6">
      <SkeletonBar className="h-12 w-64" />
      <SkeletonBar className="mt-2 h-4 w-80" />
      <SkeletonBar className="mt-8 h-12 w-full rounded-full" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <article key={i} className="space-y-3 rounded-3xl border border-slate-200 p-6">
            <SkeletonBar className="h-3 w-40" />
            <SkeletonBar className="h-8 w-3/4" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-full" />
          </article>
        ))}
      </div>
    </PageSkeletonShell>
  );
}

export function ReflectionDetailPageSkeleton() {
  return (
    <PageSkeletonShell>
      <SkeletonBar className="h-4 w-32" />
      <SkeletonBar className="mt-6 h-3 w-28" />
      <SkeletonBar className="mt-3 h-10 w-2/3" />
      <article className="surface-card mt-8 space-y-4 p-6 sm:p-8">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="ml-auto h-10 w-full max-w-lg" />
        <SkeletonBar className="h-4 w-full" />
      </article>
      <article className="paper-bg mt-12 space-y-4 rounded-3xl border border-[#d2c8b9] p-6 sm:p-8">
        <SkeletonBar className="h-8 w-40" />
        <SkeletonBar className="h-24 w-full" />
      </article>
    </PageSkeletonShell>
  );
}
