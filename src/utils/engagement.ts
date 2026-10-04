import { logger } from "@/utils/logger";
import supabase from "@/config/supabase";

export interface PostEngagement {
  likes: number;
  bookmarks: number;
}

/**
 * Efficiently fetches total likes and bookmarks for a list of post IDs.
 * 1. Tries secure Supabase RPC `get_post_engagement_counts` (aggregated on DB, 0 N+1 queries).
 * 2. Falls back to batch querying `likes` and `bookmarks` tables directly if RPC is not yet created.
 */
export async function fetchPostEngagement(
  postIds: (number | string)[]
): Promise<Record<number, PostEngagement>> {
  const result: Record<number, PostEngagement> = {};
  if (!postIds || postIds.length === 0) return result;

  // Sanitize and deduplicate post IDs into numbers for PostgreSQL bigint[]
  const numericIds: number[] = Array.from(
    new Set(
      postIds
        .map((id) => (typeof id === "string" ? parseInt(id, 10) : Number(id)))
        .filter((id): id is number => !isNaN(id) && id > 0)
    )
  );

  if (numericIds.length === 0) return result;

  // Initialize all requested posts with 0 counts
  numericIds.forEach((id) => {
    result[id] = { likes: 0, bookmarks: 0 };
  });

  // 1. Attempt secure RPC call: get_post_engagement_counts(target_post_ids bigint[])
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_post_engagement_counts",
      { target_post_ids: numericIds }
    );

    if (!rpcError && Array.isArray(rpcData)) {
      rpcData.forEach((row: any) => {
        const pId = Number(row.post_id);
        result[pId] = {
          likes: Number(row.like_count || 0),
          bookmarks: Number(row.bookmark_count || 0),
        };
      });
      return result;
    }
  } catch {
    // Continue to direct batch query fallback if RPC is missing
  }

  // 2. Direct batch aggregation fallback
  try {
    const [likesRes, bookmarksRes] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id")
        .in("post_id", postIds),
      supabase
        .from("bookmarks")
        .select("post_id")
        .in("post_id", postIds),
    ]);

    if (likesRes.data) {
      likesRes.data.forEach((row: any) => {
        const pId = Number(row.post_id);
        if (result[pId]) {
          result[pId].likes += 1;
        }
      });
    }

    if (bookmarksRes.data) {
      bookmarksRes.data.forEach((row: any) => {
        const pId = Number(row.post_id);
        if (result[pId]) {
          result[pId].bookmarks += 1;
        }
      });
    }
  } catch (err) {
    logger.warn("Engagement counts query notice:", err);
  }

  return result;
}

export const ALLOWED_REACTIONS = ["❤️", "🔥", "🎉", "👏🏻", "👍🏻"] as const;
export type ReactionType = (typeof ALLOWED_REACTIONS)[number];

export function normalizeReaction(raw: string): ReactionType | null {
  if (!raw) return null;
  if (raw === "\u2764" || raw === "❤️" || raw.startsWith("❤️") || raw.startsWith("\u2764")) {
    return "❤️";
  }
  if (raw === "🔥") return "🔥";
  if (raw === "🎉") return "🎉";
  if (raw === "👏🏻" || raw.startsWith("👏")) return "👏🏻";
  if (raw === "👍🏻" || raw.startsWith("👍")) return "👍🏻";
  return null;
}

export interface PostReactionsData {
  counts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
}

export function createEmptyReactionCounts(): Record<ReactionType, number> {
  return {
    "❤️": 0,
    "🔥": 0,
    "🎉": 0,
    "👏🏻": 0,
    "👍🏻": 0,
  };
}

export function createEmptyPostReactionsData(): PostReactionsData {
  return {
    counts: createEmptyReactionCounts(),
    userReaction: null,
  };
}

/**
 * Batch fetches reaction counts and current user's reaction for the given post IDs.
 * Single query strategy:
 * 20 posts -> collect IDs -> 1 post_reactions query -> group results by post_id
 */
export async function fetchPostReactions(
  postIds: (number | string)[],
  userId?: string | null
): Promise<Record<number, PostReactionsData>> {
  const result: Record<number, PostReactionsData> = {};
  if (!postIds || postIds.length === 0) return result;

  const numericIds: number[] = Array.from(
    new Set(
      postIds
        .map((id) => (typeof id === "string" ? parseInt(id, 10) : Number(id)))
        .filter((id): id is number => !isNaN(id) && id > 0)
    )
  );

  if (numericIds.length === 0) return result;

  // Initialize each requested post with 0 counts and null user reaction
  numericIds.forEach((id) => {
    result[id] = createEmptyPostReactionsData();
  });

  try {
    const { data, error } = await supabase
      .from("post_reactions")
      .select("post_id, user_id, reaction")
      .in("post_id", numericIds);

    if (error) {
      logger.warn("Post reactions query notice:", error);
      return result;
    }

    if (data && Array.isArray(data)) {
      data.forEach((row: any) => {
        const pId = Number(row.post_id);
        const r = normalizeReaction(row.reaction);
        if (result[pId] && r) {
          result[pId].counts[r] = (result[pId].counts[r] || 0) + 1;
          if (userId && row.user_id === userId) {
            result[pId].userReaction = r;
          }
        }
      });
    }
  } catch (err) {
    logger.warn("Post reactions batch query notice:", err);
  }

  return result;
}

/**
 * Toggles or updates a reaction for a user on a post.
 * Enforces one reaction per user per post:
 * 1. Same reaction -> Delete row (e.g. 🔥 -> none)
 * 2. Different reaction -> Update the existing row (e.g. ❤️ -> 🔥)
 * 3. No previous reaction -> Insert new row (e.g. none -> ❤️)
 */
export async function togglePostReaction(
  postId: number,
  reaction: ReactionType,
  userId: string,
  currentReaction: ReactionType | null
): Promise<{ success: boolean; action: "added" | "updated" | "removed"; error?: any }> {
  try {
    // 1. Remove reaction: If user clicks their currently selected reaction (🔥 -> none)
    if (currentReaction === reaction) {
      const { error: delErr } = await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (delErr) throw delErr;
      return { success: true, action: "removed" };
    }

    // 2. Change reaction: Update the existing row (❤️ -> 🔥)
    if (currentReaction) {
      const { data, error: updErr } = await supabase
        .from("post_reactions")
        .update({ reaction: reaction })
        .eq("post_id", postId)
        .eq("user_id", userId)
        .select("id");

      if (updErr) throw updErr;

      // Successfully updated existing row
      if (data && data.length > 0) {
        return { success: true, action: "updated" };
      }
    }

    // 3. First reaction: Insert new row (none -> ❤️)
    const { error: insErr } = await supabase
      .from("post_reactions")
      .insert({
        post_id: postId,
        user_id: userId,
        reaction: reaction,
      });

    if (insErr) {
      // If a row already exists in the database due to concurrent requests or UNIQUE(post_id, user_id), update it!
      if (
        insErr.code === "23505" ||
        insErr.message?.toLowerCase().includes("unique") ||
        insErr.message?.toLowerCase().includes("conflict")
      ) {
        const { error: updateErr } = await supabase
          .from("post_reactions")
          .update({ reaction: reaction })
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (updateErr) throw updateErr;
        return { success: true, action: "updated" };
      }
      throw insErr;
    }

    return { success: true, action: "added" };
  } catch (err) {
    logger.error("Failed to toggle reaction:", err);
    return { success: false, action: "removed", error: err };
  }
}

