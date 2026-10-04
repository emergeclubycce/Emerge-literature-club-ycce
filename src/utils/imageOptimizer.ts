import { logger } from "./logger";

export type ImageUploadSection = "shers" | "memories" | "events";

export interface SectionImageConfig {
  section: ImageUploadSection;
  label: string;
  maxOriginalBytes: number;
  maxOutputBytes: number;
  preferredTargetMinBytes?: number;
  preferredTargetMaxBytes?: number;
  maxDimension: number;
  uiHint: string;
}

export const SECTION_CONFIGS: Record<ImageUploadSection, SectionImageConfig> = {
  shers: {
    section: "shers",
    label: "Shers",
    maxOriginalBytes: 1 * 1024 * 1024, // 1 MB
    maxOutputBytes: 1 * 1024 * 1024, // 1 MB
    preferredTargetMinBytes: 30 * 1024, // 30 KB
    preferredTargetMaxBytes: 50 * 1024, // 50 KB
    maxDimension: 1200,
    uiHint: "Max size: 1 MB • Image will be optimized before upload",
  },
  memories: {
    section: "memories",
    label: "Memories",
    maxOriginalBytes: 3 * 1024 * 1024, // 3 MB
    maxOutputBytes: 3 * 1024 * 1024, // 3 MB
    maxDimension: 1920,
    uiHint: "Max size: 3 MB • Image will be optimized before upload",
  },
  events: {
    section: "events",
    label: "Events",
    maxOriginalBytes: 3 * 1024 * 1024, // 3 MB
    maxOutputBytes: 3 * 1024 * 1024, // 3 MB
    maxDimension: 1920,
    uiHint: "Max size: 3 MB • Image will be optimized before upload",
  },
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Format bytes into human-friendly strings (e.g. 48 KB, 1.2 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 KB";
  if (bytes < 1024) return "1 KB";
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1).replace(/\.0$/, "")} MB`;
}

/**
 * Validates an image file before any processing or upload.
 */
export function validateImageFile(
  file: File,
  section: ImageUploadSection
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file was selected." };
  }

  // 1. MIME and extension validation
  const lowerName = file.name.toLowerCase();
  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const isImageMime = file.type.startsWith("image/");
  const isAllowedMime = ALLOWED_MIME_TYPES.has(file.type.toLowerCase());

  if (!isImageMime || (!isAllowedMime && !hasAllowedExt)) {
    return {
      valid: false,
      error: "Please select a valid image file (JPEG, PNG, or WebP).",
    };
  }

  // 2. Original file size check
  const config = SECTION_CONFIGS[section];
  if (file.size > config.maxOriginalBytes) {
    const maxMb = Math.round(config.maxOriginalBytes / (1024 * 1024));
    return {
      valid: false,
      error: `Image is too large. Maximum allowed size is ${maxMb} MB.`,
    };
  }

  return { valid: true };
}

export interface OptimizedImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  optimizedSize: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  format: "image/webp" | "image/jpeg";
  savedPercentage: number;
}

/**
 * Check if the browser supports canvas.toBlob with WebP
 */
function supportsWebP(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const testCanvas = document.createElement("canvas");
    testCanvas.width = 1;
    testCanvas.height = 1;
    return testCanvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } catch {
    return false;
  }
}

/**
 * Decodes an image file into an HTMLImageElement
 */
function decodeImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to decode this image. The file may be corrupted or unsupported."));
    };

    img.src = objectUrl;
  });
}

/**
 * Converts a canvas to a Blob with given mimeType and quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Unable to optimize this image. Please try another image."));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Calculate scaled dimensions while strictly preserving aspect ratio
 */
function calculateDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (origWidth <= maxDimension && origHeight <= maxDimension) {
    return { width: origWidth, height: origHeight };
  }

  if (origWidth >= origHeight) {
    const ratio = origHeight / origWidth;
    const width = maxDimension;
    const height = Math.max(1, Math.round(width * ratio));
    return { width, height };
  } else {
    const ratio = origWidth / origHeight;
    const height = maxDimension;
    const width = Math.max(1, Math.round(height * ratio));
    return { width, height };
  }
}

/**
 * Performs adaptive, quality-first frontend image optimization.
 * 
 * Rules respected:
 * - Always works from original decoded image (never re-compresses already compressed output).
 * - For Shers: Preferred target is ~30-50 KB, but does NOT blindly degrade quality.
 *   Stops if quality would be noticeably harmed, retaining high visual fidelity.
 * - For Memories/Events: High-resolution quality-first optimization comfortably under 3 MB.
 * - Final validation enforces section limit.
 */
export async function optimizeImage(
  file: File,
  section: ImageUploadSection,
  options?: {
    onStatusChange?: (status: string) => void;
  }
): Promise<OptimizedImageResult> {
  const config = SECTION_CONFIGS[section];

  // 1. Initial Frontend Validation
  const validation = validateImageFile(file, section);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid image file.");
  }

  options?.onStatusChange?.("Decoding image...");

  // 2. Decode the original image
  let img: HTMLImageElement;
  try {
    img = await decodeImage(file);
  } catch (err: any) {
    logger.error("Image decode failed:", err);
    throw new Error("Unable to optimize this image. Please try another image.");
  }

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (origWidth <= 0 || origHeight <= 0) {
    throw new Error("Invalid image dimensions. Please try another image.");
  }

  const useWebP = supportsWebP();
  const targetMime: "image/webp" | "image/jpeg" = useWebP ? "image/webp" : "image/jpeg";

  options?.onStatusChange?.("Optimizing image...");

  // Helper to render from original decoded image to a specific resolution & quality
  const renderPass = async (
    targetMaxDim: number,
    quality: number
  ): Promise<{ blob: Blob; width: number; height: number }> => {
    const { width, height } = calculateDimensions(origWidth, origHeight, targetMaxDim);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Browser canvas is not available.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw from original decoded image
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, targetMime, quality);
    return { blob, width, height };
  };

  let chosenBlob: Blob | null = null;
  let chosenWidth = origWidth;
  let chosenHeight = origHeight;

  if (section === "shers") {
    // SHERS: Preferred target ~30-50 KB.
    // Quality-first adaptive search:
    // Start with high visual quality (0.88). If <= 50 KB, stop immediately.
    // If larger, carefully step down quality [0.80, 0.72, 0.65].
    // Never drop below 0.62.
    // If still above 55 KB, try scaling maxDimension from 1200 to 1000.
    // If it still cannot reach 50 KB without degradation, stop and accept the high-quality result!
    const targetMaxBytes = config.preferredTargetMaxBytes ?? 50 * 1024;
    const qualitySteps = [0.88, 0.80, 0.72, 0.65];

    let bestCandidate: { blob: Blob; width: number; height: number } | null = null;

    for (const q of qualitySteps) {
      const pass = await renderPass(config.maxDimension, q);
      bestCandidate = pass;

      if (pass.blob.size <= targetMaxBytes) {
        // Ideal target reached with high quality!
        break;
      }
    }

    // If still larger than 55 KB, and image has large dimensions, try a controlled dimension step (1000px)
    if (bestCandidate && bestCandidate.blob.size > 55 * 1024 && (origWidth > 1000 || origHeight > 1000)) {
      for (const q of [0.75, 0.68]) {
        const pass = await renderPass(1000, q);
        bestCandidate = pass;
        if (pass.blob.size <= targetMaxBytes) {
          break;
        }
      }
    }

    chosenBlob = bestCandidate?.blob ?? null;
    chosenWidth = bestCandidate?.width ?? origWidth;
    chosenHeight = bestCandidate?.height ?? origHeight;
  } else {
    // MEMORIES and EVENTS: Max 3 MB
    // Prioritize visual quality (1920px max dimension, quality 0.88).
    // Ensure final result is safely under 3 MB.
    const qualitySteps = [0.88, 0.82, 0.76];
    let candidate = await renderPass(config.maxDimension, qualitySteps[0]);

    if (candidate.blob.size > 2.5 * 1024 * 1024) {
      // Very dense image, try slight optimization step
      candidate = await renderPass(config.maxDimension, qualitySteps[1]);
    }

    if (candidate.blob.size > 2.8 * 1024 * 1024) {
      candidate = await renderPass(1600, qualitySteps[2]);
    }

    chosenBlob = candidate.blob;
    chosenWidth = candidate.width;
    chosenHeight = candidate.height;
  }

  if (!chosenBlob) {
    throw new Error("Unable to optimize this image. Please try another image.");
  }

  // 11. FINAL SIZE VALIDATION
  if (chosenBlob.size > config.maxOutputBytes) {
    const maxMb = Math.round(config.maxOutputBytes / (1024 * 1024));
    throw new Error(`Image is too large. Maximum allowed size is ${maxMb} MB.`);
  }

  // Build output filename with appropriate extension
  const ext = targetMime === "image/webp" ? ".webp" : ".jpg";
  const originalBaseName = file.name.replace(/\.[^/.]+$/, "");
  const cleanBaseName = originalBaseName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const outputFileName = `${cleanBaseName}${ext}`;

  const optimizedFile = new File([chosenBlob], outputFileName, {
    type: targetMime,
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(chosenBlob);
  const savedBytes = Math.max(0, file.size - chosenBlob.size);
  const savedPercentage = Math.round((savedBytes / file.size) * 100);

  return {
    file: optimizedFile,
    previewUrl,
    originalSize: file.size,
    optimizedSize: chosenBlob.size,
    originalWidth: origWidth,
    originalHeight: origHeight,
    width: chosenWidth,
    height: chosenHeight,
    format: targetMime,
    savedPercentage,
  };
}
