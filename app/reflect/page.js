import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import ReflectFlow from "./ReflectFlow";

function ReflectFallback() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-slate-600">Loading reflection…</p>
      </main>
    </div>
  );
}

export default function ReflectPage() {
  return (
    <Suspense fallback={<ReflectFallback />}>
      <ReflectFlow />
    </Suspense>
  );
}
