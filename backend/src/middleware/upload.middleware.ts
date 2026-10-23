import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// Use in-memory storage to stream buffers directly to Cloudinary without saving to disk
const storage = multer.memoryStorage();

// Allowed MIME types map
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    images: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"],
    videos: ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"],
    documents: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
};

const fileFilter = (allowedCategories: string[] = ["images", "videos", "documents"]) => {
    return (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
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
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedCategories.join(", ")}`));
        }
    };
};

/**
 * Image upload middleware (max 10MB)
 */
export const uploadImage = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter(["images"])
});

/**
 * Video upload middleware (max 100MB)
 */
export const uploadVideo = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: fileFilter(["videos"])
});

/**
 * Document upload middleware (max 15MB)
 */
export const uploadDocument = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: fileFilter(["documents"])
});

/**
 * Accreditation document upload middleware (PDF/JPG/PNG only, max 5MB)
 */
export const uploadAccreditationDoc = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only PDF, JPG, and PNG files under 5 MB are accepted."));
        }
    }
});

/**
 * Middleware handling accreditation document uploads with user-friendly 400 error responses
 */
export const handleAccreditationUpload = (req: Request, res: any, next: any) => {
    uploadAccreditationDoc.single("file")(req, res, (err: any) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File size exceeds 5 MB limit. Please upload a file smaller than 5 MB."
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message || "File upload failed. Only PDF, JPG, and PNG files under 5 MB are allowed."
            });
        }
        next();
    });
};

/**
 * General media upload middleware (images, videos, or documents, max 100MB)
 */
export const uploadMedia = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: fileFilter(["images", "videos", "documents"])
});

/**
 * Validate file magic bytes against declared MIME type to prevent disguised file execution
 */
export const validateMagicBytes = (buffer: Buffer, mimetype: string): boolean => {
    if (!buffer || buffer.length < 4) return false;

    // JPEG: FF D8 FF
    if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
        return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    }

    // PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
    if (mimetype === "image/png") {
        return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    }

    // GIF: 47 49 46 38 ('G' 'I' 'F' '8')
    if (mimetype === "image/gif") {
        return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
    }

    // WebP: RIFF .... WEBP
    if (mimetype === "image/webp") {
        return buffer.length >= 12 &&
            buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP";
    }

    // PDF: %PDF (25 50 44 46)
    if (mimetype === "application/pdf") {
        return buffer.toString("ascii", 0, 4) === "%PDF";
    }

    // MP4 / QuickTime / MOV: ....ftyp
    if (mimetype === "video/mp4" || mimetype === "video/quicktime") {
        if (buffer.length >= 12) {
            const brand = buffer.toString("ascii", 4, 8);
            return brand === "ftyp" || brand === "wide" || brand === "mdat" || brand === "moov";
        }
        return true;
    }

    // WebM / Matroska: 1A 45 DF A3
    if (mimetype === "video/webm" || mimetype === "video/x-matroska") {
        return buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
    }

    // Office Documents (DOCX / ZIP): PK.. (50 4B 03 04)
    if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        return buffer[0] === 0x50 && buffer[1] === 0x4B && (buffer[2] === 0x03 || buffer[2] === 0x05);
    }

    // Legacy DOC: D0 CF 11 E0
    if (mimetype === "application/msword") {
        return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
    }

    // HEIC / HEIF / AVIF: ftyp
    if (mimetype === "image/heic" || mimetype === "image/heif" || mimetype === "image/avif") {
        if (buffer.length >= 12) {
            return buffer.toString("ascii", 4, 8) === "ftyp";
        }
        return true;
    }

    return false;
};

/**
 * Middleware to enforce magic bytes inspection on in-memory buffers
 */
export const verifyUploadMagicBytes = (req: Request, res: any, next: any): any => {
    const files: Express.Multer.File[] = [];
    if (req.file) files.push(req.file);
    if (req.files && Array.isArray(req.files)) files.push(...(req.files as Express.Multer.File[]));

    for (const f of files) {
        if (f.buffer && !validateMagicBytes(f.buffer, f.mimetype)) {
            return res.status(400).json({
                success: false,
                message: `Uploaded file signature does not match declared MIME type (${f.mimetype}). File rejected for security.`
            });
        }
    }
    next();
};

export default {
    uploadImage,
    uploadVideo,
    uploadDocument,
    uploadMedia,
    validateMagicBytes,
    verifyUploadMagicBytes
};
