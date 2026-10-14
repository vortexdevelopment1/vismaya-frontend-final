const cloudinary = require("../config/cloudinary");
const streamifier = require("stream");

/**
 * Streams a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>}
 */
const uploadStream = (buffer, options = {}) => {
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
 * @param {Object} file - Multer file object (req.file)
 * @param {string} folder - Target folder in Cloudinary (e.g. "vismaya/media", "vismaya/profiles")
 * @param {Object} customOptions - Extra Cloudinary options
 * @returns {Promise<Object>}
 */
const uploadFileBuffer = async (file, folder = "vismaya/media", customOptions = {}) => {
    if (!file || !file.buffer) {
        throw new Error("No file buffer provided for Cloudinary upload");
    }

    // Determine resource_type based on MIME type
    let resourceType = "auto";
    if (file.mimetype.startsWith("image/")) {
        resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
        resourceType = "video";
    } else if (file.mimetype.startsWith("application/")) {
        resourceType = "raw";
    }

    const defaultOptions = {
        folder: folder || "vismaya/media",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...customOptions
    };

    // Auto-optimize images
    if (resourceType === "image") {
        defaultOptions.transformation = defaultOptions.transformation || [
            { quality: "auto:good" },
            { fetch_format: "auto" }
        ];
    }

    const result = await uploadStream(file.buffer, defaultOptions);

    return {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        format: result.format || file.mimetype.split("/")[1],
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
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - "image" | "video" | "raw"
 * @returns {Promise<Object>}
 */
const deleteFile = async (publicId, resourceType = "image") => {
    if (!publicId) return null;
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Generate a signed timestamp/signature for frontend direct-to-Cloudinary uploads
 * @param {string} folder
 * @param {Object} extraParams
 * @returns {Object}
 */
const generateSignedUploadParams = (folder = "vismaya/media", extraParams = {}) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
        folder,
        timestamp,
        ...extraParams
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET
    );

    return {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder
    };
};

module.exports = {
    uploadStream,
    uploadFileBuffer,
    deleteFile,
    generateSignedUploadParams
};
