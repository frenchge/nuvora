import { auth } from "@clerk/nextjs/server";
import { fetchAction, fetchMutation, fetchQuery } from "convex/nextjs";

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

export async function getConvexToken() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return null;
  }

  try {
    return await getToken({ template: "convex" });
  } catch (error) {
    throw formatConvexTokenError(error);
  }
}

export async function getRequiredConvexToken() {
  const token = await getConvexToken();
  if (!token) {
    throw new Error("Missing Convex auth token");
  }
  return token;
}

export { fetchAction, fetchMutation, fetchQuery };
