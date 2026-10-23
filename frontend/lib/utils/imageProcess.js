/**
 * Image Processing & Validation Utility for Talent Profile Photos
 * 
 * Rules:
 * 1. Accepted types: JPG, PNG, WebP (and HEIC/HEIF if decodable by browser).
 * 2. Hard minimum: shorter side >= 300 px.
 *    - < 300 px: reject with "Photo is too small. Please choose a larger photo."
 *    - 300 - 599 px: accept with hint "A larger photo gives a sharper profile."
 * 3. Resize & compress:
 *    - Scale longer side to at most 2000 px.
 *    - Crop to 4:5 portrait aspect ratio.
 *    - Export as JPEG quality 0.85 (keep PNG only if image has transparency).
 *    - Reject if still above backend limit (10 MB): "Photo is too large. Please choose a smaller one."
 * 4. Fix EXIF orientation so phone photos are upright (handled via createImageBitmap / canvas).
 */

import { PHOTO_UPLOAD_CONFIG } from "@/lib/config/photoUpload";

export const BACKEND_PHOTO_MAX_BYTES = PHOTO_UPLOAD_CONFIG.maxSizeBytes; // 5 MB

export const ACCEPTED_EXTENSIONS = PHOTO_UPLOAD_CONFIG.allowedExtensions;

export const ACCEPTED_MIME_TYPES = PHOTO_UPLOAD_CONFIG.allowedTypes;

export const VALIDATION_MESSAGES = {
  INVALID_TYPE: "Photo must be a JPG, PNG, or WebP.",
  TOO_SMALL: `Photo is smaller than ${PHOTO_UPLOAD_CONFIG.minWidth}x${PHOTO_UPLOAD_CONFIG.minHeight}px.`,
  TOO_LARGE: `Photo is too large. Maximum allowed size is ${PHOTO_UPLOAD_CONFIG.maxSizeMB} MB.`,
  UPLOAD_FAILED: "Upload failed. Please try again.",
  SHARPER_HINT: "A higher resolution photo gives a sharper profile.",
};

/**
 * Check if the file matches accepted image types.
 */
export function isValidImageType(file) {
  if (!file) return false;
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  const mimeMatch = ACCEPTED_MIME_TYPES.some(
    (allowed) => mime === allowed || mime.includes(allowed.replace("image/", ""))
  );
  const extMatch = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));

  return mimeMatch || extMatch;
}

/**
 * Decode image file into an ImageBitmap or HTMLImageElement.
 * Automatically handles EXIF orientation in modern browsers.
 */
export async function loadImageSource(file) {
  if (!file) {
    throw new Error(VALIDATION_MESSAGES.INVALID_TYPE);
  }

  // 1. Check basic file type
  if (!isValidImageType(file)) {
    throw new Error(VALIDATION_MESSAGES.INVALID_TYPE);
  }

  // 2. Try createImageBitmap with automatic EXIF orientation
  if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        isBitmap: true,
        cleanup: () => {
          try {
            bitmap.close();
          } catch (e) {}
        },
      };
    } catch (err) {
      // Browser might not decode HEIC or file might need fallback
    }
  }

  // 3. Fallback to HTMLImageElement
  if (typeof window !== "undefined") {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        resolve({
          source: img,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          isBitmap: false,
          objectUrl,
          cleanup: () => {
            try {
              URL.revokeObjectURL(objectUrl);
            } catch (e) {}
          },
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(VALIDATION_MESSAGES.INVALID_TYPE));
      };
      img.src = objectUrl;
    });
  }

  throw new Error(VALIDATION_MESSAGES.INVALID_TYPE);
}

/**
 * Check image dimensions against minimum rules.
 * Requires width >= minWidth and height >= minHeight (at least 400x400px).
 */
export function checkImageDimensions(width, height) {
  const shorterSide = Math.min(width, height);

  if (width < PHOTO_UPLOAD_CONFIG.minWidth || height < PHOTO_UPLOAD_CONFIG.minHeight) {
    return {
      valid: false,
      error: `Your photo is ${width}x${height}px. Minimum is ${PHOTO_UPLOAD_CONFIG.minWidth}x${PHOTO_UPLOAD_CONFIG.minHeight}px.`,
      hint: null,
      shorterSide,
      width,
      height
    };
  }

  if (shorterSide < 600) {
    return {
      valid: true,
      error: null,
      hint: VALIDATION_MESSAGES.SHARPER_HINT,
      shorterSide,
      width,
      height
    };
  }

  return {
    valid: true,
    error: null,
    hint: null,
    shorterSide,
    width,
    height
  };
}

/**
 * Detect if canvas has alpha transparency (for PNG preservation).
 */
export function hasAlphaTransparency(ctx, width, height) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    // Step through sampled pixels for efficiency
    const step = Math.max(1, Math.floor(imgData.length / 40000));
    for (let i = 3; i < imgData.length; i += 4 * step) {
      if (imgData[i] < 250) {
        return true;
      }
    }
  } catch (e) {
    // If tainted or unsupported, default to false
  }
  return false;
}

/**
 * Crop to 4:5 aspect ratio and scale down longer side to at most 2000 px.
 * 
 * @param {ImageBitmap|HTMLImageElement} source 
 * @param {File} originalFile 
 * @param {Object} [cropRect] - { srcX, srcY, srcW, srcH } or defaults to center 4:5 crop
 */
export async function cropAndCompressPhoto(source, originalFile, cropRect = null) {
  const srcWidth = source.width || source.naturalWidth;
  const srcHeight = source.height || source.naturalHeight;

  if (!srcWidth || !srcHeight) {
    throw new Error(VALIDATION_MESSAGES.INVALID_TYPE);
  }

  // 1. Calculate 4:5 crop rectangle if not provided
  let { srcX, srcY, srcW, srcH } = cropRect || {};
  const targetRatio = 4 / 5; // 0.8 portrait

  if (srcW == null || srcH == null) {
    const currentRatio = srcWidth / srcHeight;
    if (currentRatio > targetRatio) {
      // Too wide -> crop sides
      srcH = srcHeight;
      srcW = srcHeight * targetRatio;
      srcX = (srcWidth - srcW) / 2;
      srcY = 0;
    } else {
      // Too tall -> crop top/bottom
      srcW = srcWidth;
      srcH = srcW / targetRatio;
      srcX = 0;
      srcY = (srcHeight - srcH) / 2;
    }
  }

  // 2. Scale longer side down to at most 2000 px
  const longerSide = Math.max(srcW, srcH);
  let outW = Math.round(srcW);
  let outH = Math.round(srcH);

  if (longerSide > 2000) {
    const scaleFactor = 2000 / longerSide;
    outW = Math.round(srcW * scaleFactor);
    outH = Math.round(srcH * scaleFactor);
  }

  // Ensure exact 4:5 proportion on output canvas
  // outW should be 0.8 of outH
  outW = Math.max(1, Math.round(outH * targetRatio));

  // 3. Render onto offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error(VALIDATION_MESSAGES.UPLOAD_FAILED);
  }

  // Smooth scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fill background white for non-transparent renders
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, outW, outH);

  // Draw the selected crop window
  ctx.drawImage(
    source,
    srcX,
    srcY,
    srcW,
    srcH,
    0,
    0,
    outW,
    outH
  );

  // 4. Determine format: Keep PNG only if original is PNG and has transparency
  const isOriginalPng =
    originalFile.type === "image/png" || (originalFile.name && /\.png$/i.test(originalFile.name));
  const hasAlpha = isOriginalPng && hasAlphaTransparency(ctx, outW, outH);

  const outputMime = hasAlpha ? "image/png" : "image/jpeg";
  const outputQuality = hasAlpha ? undefined : 0.85;

  // 5. Convert canvas to Blob
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error(VALIDATION_MESSAGES.UPLOAD_FAILED));
      },
      outputMime,
      outputQuality
    );
  });

  // 6. Check size against backend limit (10 MB)
  if (blob.size > BACKEND_PHOTO_MAX_BYTES) {
    throw new Error(VALIDATION_MESSAGES.TOO_LARGE);
  }

  // 7. Generate clean file name and File instance
  const originalBase = (originalFile.name || "profile_photo").replace(/\.[^/.]+$/, "");
  const extension = outputMime === "image/png" ? ".png" : ".jpg";
  const processedFile = new File([blob], `${originalBase}_cropped${extension}`, {
    type: outputMime,
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(blob);

  return {
    file: processedFile,
    blob,
    previewUrl,
    width: outW,
    height: outH,
    mimeType: outputMime,
  };
}
