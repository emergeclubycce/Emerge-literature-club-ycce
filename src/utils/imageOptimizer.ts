/**
 * Client-Side Image Optimization Utility for Shayari Submissions.
 * 
 * Enforces:
 * 1. Hard maximum original file size of 1 MB (1,048,576 bytes).
 * 2. Supported formats: JPEG, PNG, WebP.
 * 3. Adaptive compression targeting ~30 KB - 50 KB without visual degradation.
 * 4. Preserves aspect ratio, orientation, and readability of Shayari text.
 * 5. WebP encoding with graceful fallback to JPEG/PNG.
 */

export const MAX_ORIGINAL_SIZE_BYTES = 1048576; // 1 MB (1,048,576 bytes)
export const TARGET_MIN_BYTES = 30 * 1024;      // ~30 KB
export const TARGET_MAX_BYTES = 50 * 1024;      // ~50 KB

export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface OptimizedImageResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  optimizedSize: number;
  originalName: string;
  optimizedName: string;
  width: number;
  height: number;
  reductionPercentage: number;
}

/**
 * Formats byte values into clean, readable strings (B, KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${Math.round(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

/**
 * Validates selected file BEFORE any compression or upload:
 * - Checks MIME type and extension
 * - Checks hard 1 MB limit (1,048,576 bytes)
 */
export function validateImageFile(file: File | null | undefined): ImageValidationResult {
  if (!file) {
    return { valid: false, error: "Please select an image file." };
  }

  const mimeType = (file.type || "").toLowerCase();
  const fileName = (file.name || "").toLowerCase();

  const isTypeSupported =
    SUPPORTED_MIME_TYPES.includes(mimeType) ||
    /\.(jpe?g|png|webp)$/i.test(fileName);

  if (!isTypeSupported) {
    return {
      valid: false,
      error: "Unsupported image type. Please upload JPG, PNG, or WebP.",
    };
  }

  // Hard 1 MB validation
  if (file.size > MAX_ORIGINAL_SIZE_BYTES) {
    return {
      valid: false,
      error: "Image is too large. Maximum allowed size is 1 MB.",
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "Selected image file is empty or corrupted.",
    };
  }

  return { valid: true };
}

/**
 * Checks whether the current browser canvas supports WebP encoding.
 */
function isWebPSupported(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const uri = canvas.toDataURL("image/webp");
    return uri.startsWith("data:image/webp");
  } catch {
    return false;
  }
}

/**
 * Decodes a File into an HTMLImageElement safely.
 */
function loadImageElement(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({ img, objectUrl });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image. The file may be corrupted or unreadable."));
    };

    img.src = objectUrl;
  });
}

/**
 * Canvas toBlob wrapper with Promise.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      type,
      quality
    );
  });
}

/**
 * Adaptive client-side image compression.
 * 
 * Strategy:
 * 1. Immediate validation (size <= 1 MB, supported types).
 * 2. Decode image in browser canvas.
 * 3. Choose modern WebP format where available (supports both photos & transparency).
 * 4. Bound maximum initial dimensions to 1200x1200px while strictly preserving aspect ratio.
 * 5. Iteratively test qualities (0.85 -> 0.45) and proportional scaling (1200px -> 600px).
 * 6. Target ~30 KB - 50 KB. If target cannot be reached without excessive visual degradation,
 *    keep the best visually acceptable result.
 * 7. Never destroy visual quality, text legibility, or aspect ratio.
 */
export async function optimizeImageClientSide(file: File): Promise<OptimizedImageResult> {
  // Step 1: Pre-validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Step 2: Safe browser decoding
  const { img, objectUrl } = await loadImageElement(file);

  try {
    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    if (!origWidth || !origHeight) {
      throw new Error("Invalid image dimensions detected.");
    }

    // Step 3: Determine output format
    const webpAvailable = isWebPSupported();
    let targetMime = "image/jpeg";
    let targetExt = ".jpg";

    if (webpAvailable) {
      targetMime = "image/webp";
      targetExt = ".webp";
    } else if (file.type === "image/png") {
      targetMime = "image/png";
      targetExt = ".png";
    }

    // Fast-path: If original file is already WebP, <= 50 KB, and dimensions are reasonable,
    // preserve it directly without re-compression degradation!
    if (
      file.type === "image/webp" &&
      file.size <= TARGET_MAX_BYTES &&
      origWidth <= 1200 &&
      origHeight <= 1200
    ) {
      const previewUrl = URL.createObjectURL(file);
      return {
        file,
        blob: file,
        previewUrl,
        originalSize: file.size,
        optimizedSize: file.size,
        originalName: file.name,
        optimizedName: file.name,
        width: origWidth,
        height: origHeight,
        reductionPercentage: 0,
      };
    }

    // Step 4: Setup Canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) {
      throw new Error("Browser canvas is unavailable for image processing.");
    }

    // Maximum boundary for Shayari cards (1200x1200 preserves crisp typography & artwork)
    const MAX_DIMENSION = 1200;
    const MIN_DIMENSION = 600; // Do not shrink below 600px to maintain readability

    const initialScale = Math.min(1, MAX_DIMENSION / origWidth, MAX_DIMENSION / origHeight);
    let curWidth = Math.round(origWidth * initialScale);
    let curHeight = Math.round(origHeight * initialScale);

    // Step 5: Adaptive compression loop
    // Progressively test qualities and dimensions
    const qualitySteps = [0.85, 0.75, 0.65, 0.55, 0.45];
    const dimensionScales = [1.0, 0.85, 0.70];

    let bestBlob: Blob | null = null;
    let bestSize = Infinity;
    let finalWidth = curWidth;
    let finalHeight = curHeight;

    searchLoop: for (let dIdx = 0; dIdx < dimensionScales.length; dIdx++) {
      const scaleFactor = dimensionScales[dIdx];
      const testWidth = Math.round(curWidth * scaleFactor);
      const testHeight = Math.round(curHeight * scaleFactor);

      // Don't shrink below safe readable boundaries
      if (dIdx > 0 && (testWidth < MIN_DIMENSION || testHeight < MIN_DIMENSION)) {
        break;
      }

      canvas.width = testWidth;
      canvas.height = testHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Clear & redraw from original image
      ctx.clearRect(0, 0, testWidth, testHeight);
      ctx.drawImage(img, 0, 0, testWidth, testHeight);

      for (let qIdx = 0; qIdx < qualitySteps.length; qIdx++) {
        const quality = qualitySteps[qIdx];
        const blob = await canvasToBlob(canvas, targetMime, quality);

        if (!blob || blob.size === 0) continue;

        // Keep track of smallest valid blob found so far
        if (blob.size < bestSize) {
          bestBlob = blob;
          bestSize = blob.size;
          finalWidth = testWidth;
          finalHeight = testHeight;
        }

        // If we hit our target range (<= 50 KB), we accept it!
        if (blob.size <= TARGET_MAX_BYTES) {
          // If it is in the sweet spot (>= 30 KB) or quality was high, accept immediately!
          bestBlob = blob;
          bestSize = blob.size;
          finalWidth = testWidth;
          finalHeight = testHeight;
          break searchLoop;
        }
      }
    }

    if (!bestBlob) {
      throw new Error("Failed to encode optimized image.");
    }

    // Step 6: Create optimized File object
    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const cleanBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const optimizedFileName = `${cleanBase}${targetExt}`;

    const optimizedFile = new File([bestBlob], optimizedFileName, {
      type: targetMime,
      lastModified: Date.now(),
    });

    const previewUrl = URL.createObjectURL(bestBlob);
    const reduction = Math.max(
      0,
      Math.round(((file.size - bestBlob.size) / file.size) * 100)
    );

    return {
      file: optimizedFile,
      blob: bestBlob,
      previewUrl,
      originalSize: file.size,
      optimizedSize: bestBlob.size,
      originalName: file.name,
      optimizedName: optimizedFileName,
      width: finalWidth,
      height: finalHeight,
      reductionPercentage: reduction,
    };
  } finally {
    // Clean up temporary image element object URL
    URL.revokeObjectURL(objectUrl);
  }
}
