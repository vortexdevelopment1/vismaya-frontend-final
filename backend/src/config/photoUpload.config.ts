/**
 * Profile Photo Upload Configuration (Backend)
 * Synchronized with frontend/lib/config/photoUpload.js
 */

export const PHOTO_UPLOAD_CONFIG = {
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    minWidth: 400,
    minHeight: 400,
    maxSizeMB: 5,
    maxSizeBytes: 5 * 1024 * 1024,
    helperText: "JPG/PNG/WebP, at least 400x400px, max 5 MB"
} as const;

export default PHOTO_UPLOAD_CONFIG;
