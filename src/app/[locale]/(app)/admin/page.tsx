import { redirect } from "next/navigation";
import { api } from "@convex/_generated/api";
import { fetchQuery, getRequiredConvexToken } from "@/lib/convex-server";
import { AdminDashboard } from "./_admin-dashboard";
import { BlogManager } from "./_blog-manager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = await getRequiredConvexToken();
  const profile = await fetchQuery(api.users.me, {}, { token });
  if (!profile?.is_admin) {
    redirect("/chat");
  }

  const [data, blogPosts] = await Promise.all([
    fetchQuery(api.admin.overview, {}, { token }),
    fetchQuery(api.blog.listForAdmin, {}, { token }),
  ]);

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
      <div className="px-8 pb-8 pt-10">
        <div className="mx-auto w-full max-w-6xl">
          <div className="border-b border-border/50 pb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Manage plans, discounts, and the contribution queue. Paid
              activity lands here first as pending, then you can mark it
              fulfilled once the work is done.
            </p>
          </div>

          <AdminDashboard
            initialUsers={data.users}
            initialContributions={data.contributions}
            plans={data.plans}
          />
          <BlogManager initialPosts={blogPosts} />
        </div>
      </div>
    </div>
  );
}
