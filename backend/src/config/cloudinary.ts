import { v2 as cloudinary } from "cloudinary";

export const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "zlm3b5kg",
        api_key: process.env.CLOUDINARY_API_KEY || "126714125579337",
        api_secret: process.env.CLOUDINARY_API_SECRET || "4RSlbMO-TyA7QXxqvLFKbqXcCdU",
        secure: true
    });
    return cloudinary;
};

configureCloudinary();

export default cloudinary;
