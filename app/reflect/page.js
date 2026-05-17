import { Suspense } from "react";
import { ReflectResultsPageSkeleton } from "@/components/skeletons/PageSkeletonShell";
import ReflectFlow from "./ReflectFlow";

export default function ReflectPage() {
  return (
    <Suspense fallback={<ReflectResultsPageSkeleton />}>
      <ReflectFlow />
    </Suspense>
  );
}
