module.exports = {
    MAX_FILE_SIZES: {
        photo: 10 * 1024 * 1024,      // 10 MB
        video: 100 * 1024 * 1024,    // 100 MB
        document: 15 * 1024 * 1024   // 15 MB
    },
    MAX_DURATIONS: {
        video: 300 // 5 minutes in seconds
    },
    MAX_COUNTS_PER_TYPE: {
        photo: 20,
        video: 10,
        document: 5
    },
    MAX_FEATURED_PER_USER: 4,
    ALLOWED_IMAGE_MIMES: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
    ALLOWED_VIDEO_MIMES: ["video/mp4", "video/webm", "video/quicktime"],
    ALLOWED_DOCUMENT_MIMES: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
};
