import { query } from "./_generated/server";
import { nextMonthIso, requireIdentity } from "./helpers";

export const getMyImpact = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const month = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);

    const obligations = await ctx.db.query("tree_planting_obligations").collect();
    const userRows = obligations.filter((row) => row.user_id === identity.subject);
    const userMonth = userRows.filter((row) => row.month === month);

    const sumTrees = (rows: typeof obligations) =>
      rows.reduce((sum, row) => sum + row.trees_promised, 0);

    return {
      totalUserTrees: sumTrees(userRows),
      thisMonthUserTrees: sumTrees(userMonth),
      totalCommunityTrees: sumTrees(obligations),
      nextFundingDate: nextMonthIso(),
    };
  },
});
