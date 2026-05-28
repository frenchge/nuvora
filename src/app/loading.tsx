import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-72 rounded-full" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>

        <div className="mt-20 space-y-6 text-center">
          <Skeleton className="mx-auto h-8 w-56 rounded-full" />
          <Skeleton className="mx-auto h-16 w-[42rem] max-w-full" />
          <Skeleton className="mx-auto h-6 w-[30rem] max-w-full" />
          <div className="flex items-center justify-center gap-3 pt-2">
            <Skeleton className="h-12 w-36 rounded-full" />
            <Skeleton className="h-12 w-36 rounded-full" />
          </div>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
