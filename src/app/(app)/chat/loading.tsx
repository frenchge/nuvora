import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden px-8 pb-0 pt-8 sm:px-12">
        <div className="flex h-full min-h-0 flex-col">
          <Skeleton className="ml-auto h-14 w-80 max-w-full rounded-2xl" />
          <div className="mx-auto mt-12 w-full max-w-3xl flex-1 space-y-6">
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-[88%]" />
            <Skeleton className="h-6 w-[92%]" />
            <Skeleton className="h-6 w-[76%]" />
            <div className="pt-6">
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 pt-4 sm:px-10">
        <div className="mx-auto max-w-5xl rounded-[1.75rem] bg-card px-5 pb-4 pt-4">
          <Skeleton className="h-24 w-full rounded-[1.25rem]" />
          <div className="mt-4 flex items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-10 w-44 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-11 w-11 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
