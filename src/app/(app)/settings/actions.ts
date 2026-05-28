"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@convex/_generated/api";
import { fetchMutation, getRequiredConvexToken } from "@/lib/convex-server";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";

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
  const preferredLanguage = normalizeLocale(
    typeof formData.get("language") === "string"
      ? (formData.get("language") as string)
      : null,
  );

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
      email,
      fullName: fullName || undefined,
      preferredLanguage,
    },
    { token },
  );

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, preferredLanguage, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/settings");
  revalidatePath("/billing");
  revalidatePath("/contribution");
  redirect("/settings?tab=personal&saved=1");
}
