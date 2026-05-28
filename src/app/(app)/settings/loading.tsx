import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <aside className="hidden w-[240px] shrink-0 border-r border-border/50 px-8 py-4 lg:block">
        <div className="space-y-2">
          <Skeleton className="h-11 w-36 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-8 pb-8 pt-10">
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="space-y-3 border-b border-border/50 pb-6">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-5 w-72 max-w-full" />
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <Skeleton className="h-9 w-52" />
                <Skeleton className="h-5 w-80 max-w-full" />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-11 w-32 rounded-full" />
                <Skeleton className="h-5 w-48 self-center" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
