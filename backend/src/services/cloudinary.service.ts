import cloudinary from "../config/cloudinary.js";
import streamifier from "stream";

/**
 * Streams a buffer to Cloudinary
 */
export const uploadStream = (buffer: Buffer, options: Record<string, unknown> = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
        const uploadStreamHandler = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        // Convert Buffer to readable stream and pipe to Cloudinary
        const readableStream = new streamifier.Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStreamHandler);
    });
};

/**
 * Upload a Multer file object to Cloudinary
 */
export const uploadFileBuffer = async (
    file?: { buffer?: Buffer; mimetype?: string; originalname?: string },
    folder = "vismaya/media",
    customOptions: Record<string, unknown> = {}
): Promise<{
    url: string;
    publicId: string;
    format: string;
    resourceType: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number | null;
    originalFilename?: string;
}> => {
    if (!file || !file.buffer) {
        throw new Error("No file buffer provided for Cloudinary upload");
    }

    const mime = file.mimetype || "application/octet-stream";
    const isPdf = mime === "application/pdf" || Boolean(file.originalname?.toLowerCase().endsWith(".pdf"));

    // Determine resource_type based on MIME type
    // Note: Cloudinary supports PDFs as resource_type 'image'.
    // Uploading PDFs as 'image' with format 'pdf' guarantees inline browser rendering,
    // application/pdf content-type headers, and .pdf extension rather than downloading extensionless raw files.
    let resourceType = "auto";
    if (isPdf) {
        resourceType = "image";
    } else if (mime.startsWith("image/")) {
        resourceType = "image";
    } else if (mime.startsWith("video/")) {
        resourceType = "video";
    } else if (mime.startsWith("application/")) {
        resourceType = "raw";
    }

    const defaultOptions: Record<string, unknown> = {
        folder: folder || "vismaya/media",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...customOptions
    };

    if (isPdf) {
        defaultOptions.format = "pdf";
    } else if (resourceType === "image") {
        defaultOptions.transformation = defaultOptions.transformation || [
            { quality: "auto:good" },
            { fetch_format: "auto" }
        ];
    }

    const result = await uploadStream(file.buffer, defaultOptions);

    return {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        format: result.format || mime.split("/")[1],
        resourceType: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration || null,
        originalFilename: file.originalname
    };
};

/**
 * Delete a media file from Cloudinary by its public ID
 */
export const deleteFile = async (publicId?: string, resourceType: "image" | "video" | "raw" = "image"): Promise<any> => {
    if (!publicId) return null;
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Generate a signed timestamp/signature for frontend direct-to-Cloudinary uploads
 */
export const generateSignedUploadParams = (folder = "vismaya/media", extraParams: Record<string, unknown> = {}): {
    timestamp: number;
    signature: string;
    apiKey?: string;
    cloudName?: string;
    folder: string;
} => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
        folder,
        timestamp,
        ...extraParams
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET!
    );

    return {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder
    };
};

export default {
    uploadStream,
    uploadFileBuffer,
    deleteFile,
    generateSignedUploadParams
};
