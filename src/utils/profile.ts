import supabase from "@/config/supabase";

export interface UserProfile {
  user_id: string;
  name: string | null;
  photo_url: string | null;
  instagram: string | null;
}

/**
 * Robustly retrieves the user's avatar image URL from various potential Google/OAuth metadata locations.
 */
export function getAvatarFromUser(user: any): string | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const googleIdentity =
    identities.find((id: any) => id.provider === "google") || identities[0];
  const idData = googleIdentity?.identity_data || {};

  const candidates = [
    meta.avatar_url,
    meta.picture,
    meta.avatar,
    meta.image,
    idData.avatar_url,
    idData.picture,
    idData.avatar,
    meta.custom_claims?.picture,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      const trimmed = candidate.trim();
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/")
      ) {
        return trimmed;
      }
    }
  }

  return null;
}

/**
 * Robustly retrieves the user's display name from Google/OAuth metadata locations.
 */
export function getNameFromUser(user: any): string | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const googleIdentity =
    identities.find((id: any) => id.provider === "google") || identities[0];
  const idData = googleIdentity?.identity_data || {};

  const candidates = [
    meta.full_name,
    meta.name,
    meta.user_name,
    idData.full_name,
    idData.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

/**
 * Ensures the authenticated user has a profile record in public.profiles.
 * - Extracts name and photo from Google OAuth metadata (supporting avatar_url & picture & identities)
 * - If profile does not exist: creates it with Google metadata
 * - If profile exists: preserves existing instagram, fills missing name/photo only when appropriate
 * - Returns the resulting profile
 */
export async function syncUserProfile(user: any): Promise<UserProfile | null> {
  if (!user?.id) return null;

  try {
    const metaName = getNameFromUser(user);
    const metaPhoto = getAvatarFromUser(user);

    // 1. Fetch existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url, instagram")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.warn("Notice checking user profile:", fetchError.message);
      return null;
    }

    if (existingProfile) {
      // Profile exists. Preserve instagram strictly.
      // Update name/photo only if existing profile lacks them and metadata provides them.
      const needsNameUpdate = !existingProfile.name?.trim() && Boolean(metaName);
      const needsPhotoUpdate = !existingProfile.photo_url?.trim() && Boolean(metaPhoto);

      if (needsNameUpdate || needsPhotoUpdate) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (needsNameUpdate) updatePayload.name = metaName;
        if (needsPhotoUpdate) updatePayload.photo_url = metaPhoto;

        const { data: updated, error: updateError } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("user_id", user.id)
          .select("user_id, name, photo_url, instagram")
          .maybeSingle();

        if (!updateError && updated) {
          return updated as UserProfile;
        }
      }

      return existingProfile as UserProfile;
    } else {
      // Profile does not exist. Create using user id and Google OAuth metadata.
      const newRecord = {
        user_id: user.id,
        name: metaName || "Club Member",
        photo_url: metaPhoto || null,
        instagram: null,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert(newRecord)
        .select("user_id, name, photo_url, instagram")
        .maybeSingle();

      if (insertError) {
        console.warn("Notice inserting initial profile:", insertError.message);
        return newRecord as UserProfile;
      }

      return (inserted || newRecord) as UserProfile;
    }
  } catch (err) {
    console.warn("syncUserProfile error:", err);
    return null;
  }
}
