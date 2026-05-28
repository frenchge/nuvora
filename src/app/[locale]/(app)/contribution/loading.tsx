import { Skeleton } from "@/components/ui/skeleton";

export default function ContributionLoading() {
  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
      <div className="px-8 pb-8 pt-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-[32rem] max-w-full" />
          </div>
          <div className="grid gap-6 border-b border-border/50 pb-8 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-[460px] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
