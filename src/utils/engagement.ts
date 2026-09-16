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
    console.warn("Engagement counts query notice:", err);
  }

  return result;
}
