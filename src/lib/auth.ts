import { auth, currentUser } from "@clerk/nextjs/server";
import { api } from "@convex/_generated/api";
import { fetchMutation } from "./convex-server";
import type { UserProfile } from "./types";

function formatConvexTokenError(error: unknown): Error {
  const details =
    error && typeof error === "object"
      ? JSON.stringify(
          {
            status: "status" in error ? (error as { status?: unknown }).status : undefined,
            clerkTraceId:
              "clerkTraceId" in error
                ? (error as { clerkTraceId?: unknown }).clerkTraceId
                : undefined,
            errors: "errors" in error ? (error as { errors?: unknown }).errors : undefined,
            message: "message" in error ? (error as { message?: unknown }).message : undefined,
          },
          null,
          2
        )
      : String(error);

  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    "message" in error &&
    (error as { status?: number }).status === 404
  ) {
    return new Error(
      `Clerk could not mint the Convex token. Create a Clerk JWT template named "convex" and use your Clerk Frontend API URL as CLERK_JWT_ISSUER_DOMAIN.\n${details}`
    );
  }

  return error instanceof Error ? new Error(`${error.message}\n${details}`) : new Error(`Failed to get Convex auth token\n${details}`);
}

/**
 * Resolve the Clerk-authenticated user and ensure a users_profile row
 * exists in Convex. Returns null if the request is unauthenticated.
 *
 * Safe to call from any server component or route handler.
 */
export async function getOrCreateProfile(): Promise<UserProfile | null> {
  const { userId, getToken } = await auth();
  if (!userId) return null;

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses?.[0]?.emailAddress;
  const fullName = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || undefined;
  let token: string | null;
  try {
    token = await getToken({ template: "convex" });
  } catch (error) {
    throw formatConvexTokenError(error);
  }
  if (!token) {
    throw new Error("Missing Convex auth token");
  }

  return await fetchMutation(
    api.users.ensureCurrentUser,
    { email, fullName },
    { token }
  );
}

export function isAdminUserId(userId: string): boolean {
  const list = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(userId);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email?.trim().toLowerCase() ?? "") === "lahmerselim@gmail.com";
}

export async function requireUser(): Promise<UserProfile> {
  const profile = await getOrCreateProfile();
  if (!profile) {
    throw new HttpError(401, "Not authenticated");
  }
  return profile;
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await requireUser();
  if (
    !profile.is_admin &&
    !isAdminUserId(profile.user_id) &&
    !isAdminEmail(profile.email)
  ) {
    throw new HttpError(403, "Forbidden");
  }
  return profile;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
