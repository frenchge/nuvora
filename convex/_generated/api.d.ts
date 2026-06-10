/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as blog from "../blog.js";
import type * as chats from "../chats.js";
import type * as contributions from "../contributions.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as defaults from "../defaults.js";
import type * as helpers from "../helpers.js";
import type * as messages from "../messages.js";
import type * as models from "../models.js";
import type * as seed from "../seed.js";
import type * as stripe from "../stripe.js";
import type * as trees from "../trees.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  blog: typeof blog;
  chats: typeof chats;
  contributions: typeof contributions;
  credits: typeof credits;
  crons: typeof crons;
  defaults: typeof defaults;
  helpers: typeof helpers;
  messages: typeof messages;
  models: typeof models;
  seed: typeof seed;
  stripe: typeof stripe;
  trees: typeof trees;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
