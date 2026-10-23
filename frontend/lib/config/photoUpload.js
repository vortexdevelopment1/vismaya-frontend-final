/**
 * Shared Profile Photo & Logo Upload Configuration
 * Defines rules for allowed image types, minimum dimensions, and maximum file size.
 * Synchronized with backend Multer and Cloudinary configurations.
 */

export const PHOTO_UPLOAD_CONFIG = {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  minWidth: 400,
  minHeight: 400,
  maxSizeMB: 5,
  maxSizeBytes: 5 * 1024 * 1024,
  helperText: "JPG/PNG/WebP, at least 400x400px, max 5 MB",
};

/**
 * Validate image file and optional dimensions.
 * Produces clear, actionable error messages with actual vs required values.
 * 
 * @param {File} file - The file object from input change event
 * @param {number} [width] - Image width in pixels
 * @param {number} [height] - Image height in pixels
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePhotoFile(file, width, height) {
  if (!file) {
    return { valid: false, error: "No photo selected. Please choose a photo to upload." };
  }

  // 1. Format check
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const isTypeAllowed = PHOTO_UPLOAD_CONFIG.allowedTypes.some(
    (t) => mime === t || mime.includes(t.replace("image/", ""))
  );
  const isExtAllowed = PHOTO_UPLOAD_CONFIG.allowedExtensions.some((ext) => name.endsWith(ext));

  if (!isTypeAllowed && !isExtAllowed) {
    return {
      valid: false,
      error: `Unsupported format (${file.type || "unknown"}). Allowed formats: JPG, PNG, WebP.`,
    };
  }

  // 2. File size check
  if (file.size > PHOTO_UPLOAD_CONFIG.maxSizeBytes) {
    const actualMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Your photo is ${actualMB} MB. Maximum allowed size is ${PHOTO_UPLOAD_CONFIG.maxSizeMB} MB.`,
    };
  }

  // 3. Dimension check (when width and height are known)
  if (typeof width === "number" && typeof height === "number") {
    if (width < PHOTO_UPLOAD_CONFIG.minWidth || height < PHOTO_UPLOAD_CONFIG.minHeight) {
      return {
        valid: false,
        error: `Your photo is ${width}x${height}px. Minimum is ${PHOTO_UPLOAD_CONFIG.minWidth}x${PHOTO_UPLOAD_CONFIG.minHeight}px.`,
      };
    }
  }

  return { valid: true };
}

export default PHOTO_UPLOAD_CONFIG;
