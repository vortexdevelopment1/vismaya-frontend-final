export const MAX_FILE_SIZES = {
    photo: 10 * 1024 * 1024,      // 10 MB
    video: 100 * 1024 * 1024,    // 100 MB
    document: 15 * 1024 * 1024   // 15 MB
} as const;

export const MAX_DURATIONS = {
    video: 300 // 5 minutes in seconds
} as const;

export const MAX_COUNTS_PER_TYPE = {
    photo: 20,
    video: 10,
    document: 5
} as const;

export const MAX_FEATURED_PER_USER = 4;

export const ALLOWED_IMAGE_MIMES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg"
] as const;

export const ALLOWED_VIDEO_MIMES = [
    "video/mp4",
    "video/webm",
    "video/quicktime"
] as const;

export const ALLOWED_DOCUMENT_MIMES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

const mediaLimits = {
    MAX_FILE_SIZES,
    MAX_DURATIONS,
    MAX_COUNTS_PER_TYPE,
    MAX_FEATURED_PER_USER,
    ALLOWED_IMAGE_MIMES,
    ALLOWED_VIDEO_MIMES,
    ALLOWED_DOCUMENT_MIMES
};

export default mediaLimits;
