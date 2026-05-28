import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureProfile,
  getProfile,
  getProfileM,
  mapProfile,
  requireIdentity,
} from "./helpers";

const MANUAL_ADMIN_EMAILS = new Set(["lahmerselim@gmail.com"]);

function shouldBeAdmin(userId: string, email?: string | null) {
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  return (
    adminIds.includes(userId) ||
    (normalizedEmail !== null && MANUAL_ADMIN_EMAILS.has(normalizedEmail))
  );
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfile(ctx, identity.subject);
    return profile ? mapProfile(profile) : null;
  },
});

export const ensureCurrentUser = mutation({
  args: {
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const profile = await ensureProfile(ctx, {
      userId: identity.subject,
      email: args.email,
      fullName: args.fullName,
      preferredLanguage: args.preferredLanguage,
    });
    return mapProfile(profile);
  },
});

export const syncCurrentUserIdentity = mutation({
  args: {
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await getProfileM(ctx, identity.subject);

    if (!existing) {
      const created = await ensureProfile(ctx, {
        userId: identity.subject,
        email: args.email,
        fullName: args.fullName,
        preferredLanguage: args.preferredLanguage,
      });
      return mapProfile(created);
    }

    const nextEmail = args.email ?? existing.email;
    const nextFullName = args.fullName ?? existing.full_name;
    const nextPreferredLanguage =
      args.preferredLanguage ?? existing.preferred_language;
    const nextIsAdmin = shouldBeAdmin(identity.subject, nextEmail);

    if (
      nextEmail !== existing.email ||
      nextFullName !== existing.full_name ||
      nextPreferredLanguage !== existing.preferred_language ||
      nextIsAdmin !== existing.is_admin
    ) {
      await ctx.db.patch(existing._id, {
        email: nextEmail,
        full_name: nextFullName,
        preferred_language: nextPreferredLanguage,
        is_admin: nextIsAdmin,
      });
    }

    const updated = await getProfileM(ctx, identity.subject);
    if (!updated) {
      throw new Error("Profile not found after sync");
    }
    return mapProfile(updated);
  },
});

export const clearPendingPlanWelcome = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const existing = await getProfileM(ctx, identity.subject);
    if (!existing || !existing.pending_plan_welcome) {
      return null;
    }
    await ctx.db.patch(existing._id, {
      pending_plan_welcome: undefined,
    });
    return null;
  },
});
