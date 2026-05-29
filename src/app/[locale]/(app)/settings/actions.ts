"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@convex/_generated/api";
import { fetchMutation, getRequiredConvexToken } from "@/lib/convex-server";

function normalizeNamePart(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

export async function savePersonalInfo(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const firstName = normalizeNamePart(formData.get("firstName"));
  const lastName = normalizeNamePart(formData.get("lastName"));

  const client = await clerkClient();
  const updatedUser = await client.users.updateUser(userId, {
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  const email =
    updatedUser.primaryEmailAddress?.emailAddress ??
    updatedUser.emailAddresses?.[0]?.emailAddress;
  const fullName = [updatedUser.firstName, updatedUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const token = await getRequiredConvexToken();
  await fetchMutation(
    api.users.syncCurrentUserIdentity,
    {
      email: email ?? undefined,
      fullName: fullName || undefined,
    },
    { token },
  );

  revalidatePath("/settings");
  revalidatePath("/billing");
  redirect("/settings?tab=personal&saved=1");
}
