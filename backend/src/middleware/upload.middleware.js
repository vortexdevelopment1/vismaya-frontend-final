const multer = require("multer");

// Use in-memory storage to stream buffers directly to Cloudinary without saving to disk
const storage = multer.memoryStorage();

// Allowed MIME types map
const ALLOWED_MIME_TYPES = {
    images: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"],
    videos: ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"],
    documents: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
};

const fileFilter = (allowedCategories = ["images", "videos", "documents"]) => {
    return (req, file, cb) => {
        let isAllowed = false;

        for (const cat of allowedCategories) {
            if (ALLOWED_MIME_TYPES[cat] && ALLOWED_MIME_TYPES[cat].includes(file.mimetype)) {
                isAllowed = true;
                break;
            }
        }

        if (isAllowed) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedCategories.join(", ")}`), false);
        }
    };
};

/**
 * Image upload middleware (max 10MB)
 */
const uploadImage = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter(["images"])
});

/**
 * Video upload middleware (max 100MB)
 */
const uploadVideo = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: fileFilter(["videos"])
});

/**
 * Document upload middleware (max 15MB)
 */
const uploadDocument = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: fileFilter(["documents"])
});

/**
 * General media upload middleware (images, videos, or documents, max 100MB)
 */
const uploadMedia = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: fileFilter(["images", "videos", "documents"])
});

module.exports = {
    uploadImage,
    uploadVideo,
    uploadDocument,
    uploadMedia
};
