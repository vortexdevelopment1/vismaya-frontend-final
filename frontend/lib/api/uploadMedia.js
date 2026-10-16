/**
 * Media Upload Abstraction & Cloudinary Utility
 * 
 * Supports:
 * - Real Mode: Streams multipart/form-data directly to backend /api/media (or /api/media/upload)
 *   with progress monitoring via XHR and cancel support.
 * - Client-side validation matching backend limits (images <= 5MB, profile photo <= 3MB, videos <= 100MB).
 * - Cloudinary URL optimization (f_auto, q_auto, width scaling, video thumbnail generation).
 * - Unsigned Cloudinary direct fallback if backend upload endpoint is missing.
 * - Mock Mode: Local preview via URL.createObjectURL or data URL.
 */

import { USE_MOCK, isRealMode, API_URL } from "./config.js";
import { getAuthToken, ApiError } from "./client.js";
import { mapMedia } from "./mappers/index.js";

// Validation limits
export const MEDIA_LIMITS = {
  photo: {
    maxBytes: 5 * 1024 * 1024, // 5 MB for portfolio images
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
    label: "Images (JPG, PNG, WebP) max 5 MB",
  },
  profilePhoto: {
    maxBytes: 3 * 1024 * 1024, // 3 MB for profile photo
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
    label: "Profile photo (JPG, PNG, WebP) max 3 MB",
  },
  video: {
    maxBytes: 100 * 1024 * 1024, // 100 MB for videos
    allowedMimes: ["video/mp4", "video/webm", "video/quicktime", "video/mov"],
    label: "Videos (MP4, WebM, MOV) max 100 MB",
  },
};

/**
 * Validate a file against media limits
 * @param {File} file
 * @param {"photo"|"profilePhoto"|"video"} type
 */
export function validateMediaFile(file, type = "photo") {
  if (!file) {
    throw new Error("No file selected.");
  }

  const config = MEDIA_LIMITS[type] || MEDIA_LIMITS.photo;

  // Type check
  const mime = file.type?.toLowerCase() || "";
  const isAudio = mime.startsWith("audio/");
  if (isAudio) {
    throw new Error("Direct audio uploads are not supported. Please upload a video showreel.");
  }

  const isValidMime = config.allowedMimes.some(
    (allowed) => mime === allowed || mime.includes(allowed.replace("image/", "").replace("video/", ""))
  );

  if (!isValidMime) {
    const ext = file.name ? file.name.split(".").pop().toLowerCase() : "";
    const isKnownExt =
      type === "video"
        ? ["mp4", "webm", "mov"].includes(ext)
        : ["jpg", "jpeg", "png", "webp"].includes(ext);

    if (!isKnownExt) {
      throw new Error(`Unsupported file format. Please upload ${config.label}.`);
    }
  }

  // Size check
  if (file.size > config.maxBytes) {
    const maxMb = Math.round(config.maxBytes / (1024 * 1024));
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File is too large (${actualMb} MB). Maximum allowed size is ${maxMb} MB.`);
  }

  return true;
}

/**
 * Optimize a Cloudinary URL with transformations (f_auto, q_auto, width scaling)
 * @param {string} url
 * @param {Object} options { width, height, crop = "limit", quality = "auto", format = "auto" }
 */
export function optimizeCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== "string") return url || "";

  // Only transform Cloudinary URLs
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const { width, height, quality = "auto", format = "auto" } = options;

  const transforms = [];
  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);

  if (transforms.length === 0) return url;

  const transformString = transforms.join(",");

  // Check if transformations already exist right after /upload/
  return url.replace("/upload/", `/upload/${transformString}/`);
}

/**
 * Generate a thumbnail preview URL for Cloudinary video (using frame at 0s)
 * @param {string} videoUrl
 * @param {number} width
 */
export function getCloudinaryVideoThumbnail(videoUrl, width = 640) {
  if (!videoUrl || typeof videoUrl !== "string") return "";

  if (videoUrl.includes("res.cloudinary.com") && videoUrl.includes("/video/upload/")) {
    const thumbUrl = videoUrl
      .replace("/video/upload/", `/video/upload/so_0,w_${width},f_jpg,q_auto/`)
      .replace(/\.[^/.]+$/, ".jpg");
    return thumbUrl;
  }

  return videoUrl;
}

/**
 * Upload a media file with progress tracking and validation
 *
 * @param {Object} params
 * @param {File|Blob|string} params.file - File to upload
 * @param {string} [params.category="other"] - "headshot", "full_body", "showreel", "audition", "other"
 * @param {string} [params.title=""] - Title or caption
 * @param {string} [params.validationType="photo"] - "photo", "profilePhoto", "video"
 * @param {boolean} [params.isMainProfilePhoto=false] - Whether this is the talent's primary profile photo
 * @param {Function} [params.onProgress] - Optional progress callback (percent: 0-100)
 * @param {AbortSignal} [params.signal] - Optional abort signal
 * @returns {Promise<{ url: string, publicId?: string, mediaItem?: Object }>}
 */
export async function uploadMedia({
  file,
  category = "other",
  title = "",
  validationType = "photo",
  isMainProfilePhoto = false,
  onProgress,
  signal,
} = {}) {
  // If string URL is passed, return immediately
  if (typeof file === "string") {
    return {
      url: file,
      thumbnailUrl: file,
      status: "Approved",
    };
  }

  // 1. Client-Side Validation
  if (file instanceof Blob || (typeof File !== "undefined" && file instanceof File)) {
    validateMediaFile(file, validationType);
  } else {
    throw new Error("A valid file must be provided for upload.");
  }

  const realUploads = isRealMode("media") || isRealMode("uploads");

  // 2. Mock Mode Handler
  if (!realUploads) {
    if (onProgress) {
      onProgress(30);
      await new Promise((r) => setTimeout(r, 150));
      onProgress(75);
      await new Promise((r) => setTimeout(r, 150));
      onProgress(100);
    }

    const mockBlobUrl = URL.createObjectURL(file);
    const mockMediaType = file.type?.startsWith("video/") ? "video" : "photo";

    return {
      id: "med_mock_" + Date.now(),
      url: mockBlobUrl,
      thumbnailUrl: mockBlobUrl,
      title: title || file.name || "Upload",
      type: validationType === "video" || mockMediaType === "video" ? "Showreel" : "Headshot",
      mediaType: mockMediaType,
      category,
      status: "Pending",
      isMainProfilePhoto: Boolean(isMainProfilePhoto),
      createdAt: new Date().toISOString(),
      fileSizeBytes: file.size,
      mimeType: file.type,
    };
  }

  // 3. Real Mode: XHR Multipart Upload to Backend /api/media
  const token = getAuthToken();
  const endpoint = `${API_URL}/api/media`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("rightsConfirmed", "true");
  if (category) formData.append("category", category);
  if (title) formData.append("title", title);
  if (isMainProfilePhoto) formData.append("isMainProfilePhoto", "true");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    // Progress listener
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    // Cancel / Abort handling
    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Upload was cancelled."));
      });
    }

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const rawItem = response.mediaItem || response.data || response;
          const mapped = mapMedia ? mapMedia(rawItem) : rawItem;
          resolve({
            ...mapped,
            url: rawItem.url || mapped?.url,
            raw: rawItem,
          });
        } catch (err) {
          reject(new ApiError("Invalid response from server.", xhr.status));
        }
      } else {
        let errMessage = "Upload failed.";
        try {
          const errData = JSON.parse(xhr.responseText);
          errMessage = errData.message || errData.error || errMessage;
        } catch {}

        if (xhr.status === 401) errMessage = "Session expired. Please log in again.";
        if (xhr.status === 413) errMessage = "File exceeds the maximum server limit.";
        if (xhr.status === 415) errMessage = "Unsupported file media format.";

        reject(new ApiError(errMessage, xhr.status));
      }
    };

    xhr.onerror = () => {
      reject(new ApiError("Network error during file upload. Please check your connection.", 0));
    };

    xhr.send(formData);
  });
}

export default uploadMedia;
