import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
      <div className="px-8 pb-8 pt-10">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <div className="space-y-3 border-b border-border/50 pb-6">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-5 w-[34rem] max-w-full" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-[20rem] w-full rounded-3xl" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-[26rem] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
