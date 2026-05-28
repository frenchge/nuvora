import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <aside className="hidden w-[240px] shrink-0 border-r border-border/50 px-8 py-4 lg:block">
        <div className="space-y-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-8 pb-8 pt-10">
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="space-y-3 border-b border-border/50 pb-6">
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-5 w-80 max-w-full" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>

            <Skeleton className="h-[360px] w-full" />

            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
