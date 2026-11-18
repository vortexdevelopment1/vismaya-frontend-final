
import { uploadToRustFS, deleteFromRustFS,getRustFSPresignedUrl, } from "./rustfs.service.js";

/**
 * Upload a Multer file to RustFS.
 */
export const uploadFileBuffer = async (
    file?: {
        buffer?: Buffer;
        mimetype?: string;
        originalname?: string;
        size?: number;
    },
    folder = "vismaya/media",
    customOptions: Record<string, unknown> = {}
): Promise<{
    url: string;
    publicId: string;
    objectKey: string;
    format: string;
    resourceType: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number | null;
    originalFilename?: string;
}> => {
    if (!file?.buffer) {
        throw new Error("No file buffer provided for RustFS upload");
    }

    const mime = file.mimetype || "application/octet-stream";

    const result = await uploadToRustFS(
        {
            ...file,
            size: file.size ?? file.buffer.length,
        } as Express.Multer.File,
        {
            folder,
            contentType: mime,
        }
    );

    const downloadUrl = await getRustFSPresignedUrl(result.key);

    const extension = file.originalname?.split(".").pop() || "";

    return {
        url: downloadUrl,
        publicId: result.key,
        objectKey: result.key,
        format: extension,
        resourceType: mime.startsWith("image/")
            ? "image"
            : mime.startsWith("video/")
                ? "video"
                : "raw",
        bytes: result.fileSize,
        originalFilename: result.originalFilename,
    };
};

/**
 * Delete a file from RustFS using its object key.
 */
export const deleteFile = async (objectKey?: string): Promise<void> => {
    if (!objectKey) return;
    await deleteFromRustFS(objectKey);
};

/**
 * Cloudinary direct-upload signatures are no longer supported.
 */
export const generateSignedUploadParams = (
    _folder?: string,
    _extraParams: Record<string, unknown> = {}
): null => {
    return null;
};

export default {
    uploadFileBuffer,
    deleteFile,
    generateSignedUploadParams,
};
