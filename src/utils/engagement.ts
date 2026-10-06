import { logger } from "@/utils/logger";
import supabase from "@/config/supabase";

export interface PostEngagement {
  likes: number;
  bookmarks: number;
}

const PAGE_SIZE = 1000; // PostgREST default max rows per request

/**
 * Sanitize + deduplicate post IDs into positive safe integers.
 * Rejects things like "12abc", NaN, 0, negatives and floats.
 */
function toNumericIds(postIds: (number | string)[] | null | undefined): number[] {
  if (!postIds || postIds.length === 0) return [];
  const ids = new Set<number>();
  for (const raw of postIds) {
    const n = typeof raw === "string" ? Number(raw.trim()) : Number(raw);
    if (Number.isSafeInteger(n) && n > 0) ids.add(n);
  }
  return Array.from(ids);
}

/**
 * Fetch every row of a query by paging with .range(), so we never
 * silently hit the 1000-row cap.
 */
async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<{ data: T[]; error: any }> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) return { data: all, error };
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: all, error: null };
}

/**
 * Efficiently fetches total likes and bookmarks for a list of post IDs.
 * 1. Tries Supabase RPC `get_post_engagement_counts` (aggregated in the DB).
 * 2. Falls back to paginated direct queries on `likes` and `bookmarks`.
 */
export async function fetchPostEngagement(
  postIds: (number | string)[]
): Promise<Record<number, PostEngagement>> {
  const result: Record<number, PostEngagement> = {};
  const numericIds = toNumericIds(postIds);
  if (numericIds.length === 0) return result;

  // Initialize all requested posts with 0 counts
  numericIds.forEach((id) => {
    result[id] = { likes: 0, bookmarks: 0 };
  });

  // 1. RPC: get_post_engagement_counts(target_post_ids bigint[])
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_post_engagement_counts",
      { target_post_ids: numericIds }
    );

    if (!rpcError && Array.isArray(rpcData)) {
      rpcData.forEach((row: any) => {
        const pId = Number(row.post_id);
        if (!result[pId]) return;
        result[pId] = {
          likes: Number(row.like_count || 0),
          bookmarks: Number(row.bookmark_count || 0),
        };
      });
      return result;
    }

    if (rpcError) {
      logger.warn("get_post_engagement_counts RPC failed, using fallback:", rpcError);
    }
  } catch (err) {
    logger.warn("get_post_engagement_counts RPC threw, using fallback:", err);
  }

  // 2. Direct (paginated) aggregation fallback
  try {
    const [likesRes, bookmarksRes] = await Promise.all([
      fetchAllRows<{ post_id: number }>((from, to) =>
        supabase
          .from("likes")
          .select("post_id")
          .in("post_id", numericIds)
          .range(from, to)
      ),
      fetchAllRows<{ post_id: number }>((from, to) =>
        supabase
          .from("bookmarks")
          .select("post_id")
          .in("post_id", numericIds)
          .range(from, to)
      ),
    ]);

    if (likesRes.error) logger.warn("Likes query failed:", likesRes.error);
    if (bookmarksRes.error) logger.warn("Bookmarks query failed:", bookmarksRes.error);

    likesRes.data.forEach((row) => {
      const pId = Number(row.post_id);
      if (result[pId]) result[pId].likes += 1;
    });

    bookmarksRes.data.forEach((row) => {
      const pId = Number(row.post_id);
      if (result[pId]) result[pId].bookmarks += 1;
    });
  } catch (err) {
    logger.warn("Engagement counts fallback failed:", err);
  }

  return result;
}

export const ALLOWED_REACTIONS = ["❤️", "🔥", "🎉", "👏🏻", "👍🏻", "🥲"] as const;
export type ReactionType = (typeof ALLOWED_REACTIONS)[number];

export function normalizeReaction(raw: string | null | undefined): ReactionType | null {
  if (!raw) return null;
  if (raw.startsWith("❤") || raw.startsWith("\u2764")) return "❤️";
  if (raw.startsWith("🔥")) return "🔥";
  if (raw.startsWith("🎉")) return "🎉";
  if (raw.startsWith("👏")) return "👏🏻";
  if (raw.startsWith("👍")) return "👍🏻";
  if (raw.startsWith("🥲")) return "🥲";
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
    "🥲": 0,
  };
}

export function createEmptyPostReactionsData(): PostReactionsData {
  return {
    counts: createEmptyReactionCounts(),
    userReaction: null,
  };
}

/**
 * Batch fetches reaction counts and the current user's reaction for the given post IDs.
 * Pages through results so counts are never truncated at 1000 rows.
 *
 * (For very busy posts, replace this with a DB-side aggregate RPC:
 *   select post_id, reaction, count(*) from post_reactions
 *   where post_id = any(target_post_ids) group by post_id, reaction;
 * and fetch the user's own reaction in a separate small query.)
 */
export async function fetchPostReactions(
  postIds: (number | string)[],
  userId?: string | null
): Promise<Record<number, PostReactionsData>> {
  const result: Record<number, PostReactionsData> = {};
  const numericIds = toNumericIds(postIds);
  if (numericIds.length === 0) return result;

  numericIds.forEach((id) => {
    result[id] = createEmptyPostReactionsData();
  });

  try {
    const { data, error } = await fetchAllRows<{
      post_id: number;
      user_id: string;
      reaction: string;
    }>((from, to) =>
      supabase
        .from("post_reactions")
        .select("post_id, user_id, reaction")
        .in("post_id", numericIds)
        .order("post_id", { ascending: true }) // stable order for pagination
        .range(from, to)
    );

    if (error) {
      logger.warn("Post reactions query failed:", error);
    }

    data.forEach((row) => {
      const pId = Number(row.post_id);
      const r = normalizeReaction(row.reaction);
      if (result[pId] && r) {
        result[pId].counts[r] += 1;
        if (userId && row.user_id === userId) {
          result[pId].userReaction = r;
        }
      }
    });
  } catch (err) {
    logger.warn("Post reactions batch query failed:", err);
  }

  return result;
}

export type ToggleReactionResult =
  | { success: true; action: "added" | "updated" | "removed" }
  | { success: false; action: null; error: unknown };

/**
 * Toggles or updates a reaction for a user on a post.
 * Enforces one reaction per user per post (requires UNIQUE(post_id, user_id)):
 * 1. Same reaction     -> delete row   (🔥 -> none)
 * 2. Different/new     -> upsert row   (❤️ -> 🔥, or none -> ❤️)
 *
 * NOTE: Make sure RLS on post_reactions enforces user_id = auth.uid(),
 * otherwise a client could react on behalf of another user.
 */
export async function togglePostReaction(
  postId: number,
  reaction: ReactionType,
  userId: string,
  currentReaction: ReactionType | null
): Promise<ToggleReactionResult> {
  try {
    // 1. Remove reaction
    if (currentReaction === reaction) {
      const { error: delErr } = await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (delErr) throw delErr;
      return { success: true, action: "removed" };
    }

    // 2. Add or change reaction in one race-safe statement
    const { error: upsertErr } = await supabase
      .from("post_reactions")
      .upsert(
        { post_id: postId, user_id: userId, reaction },
        { onConflict: "post_id,user_id" }
      );

    if (upsertErr) throw upsertErr;

    return { success: true, action: currentReaction ? "updated" : "added" };
  } catch (err) {
    logger.error("Failed to toggle reaction:", err);
    return { success: false, action: null, error: err };
  }
}