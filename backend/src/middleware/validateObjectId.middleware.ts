import { Request, Response, NextFunction, RequestHandler } from "express";
import mongoose from "mongoose";

/**
 * Middleware factory to validate MongoDB ObjectId route parameters
 * Returns 400 Bad Request instead of allowing unhandled CastError (500)
 */
export const validateObjectId = (paramName = "id"): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): any => {
        const idValue = req.params[paramName];
        if (idValue && !mongoose.Types.ObjectId.isValid(String(idValue))) {
            // Allow Vismaya custom IDs (e.g., VIS-123456) for user, talent, or profile parameters
            if (["userId", "talentId", "profileId"].includes(paramName) && typeof idValue === "string" && idValue.startsWith("VIS-")) {
                return next();
            }
            return res.status(400).json({
                success: false,
                message: `Invalid identifier format for '${paramName}': ${idValue}`
            });
        }
        next();
    };
};

/**
 * Parameter middleware that can be applied via router.param
 */
export const validateObjectIdParam = (req: Request, res: Response, next: NextFunction, val: string, name: string): any => {
    if (val && !mongoose.Types.ObjectId.isValid(val)) {
        // Allow Vismaya custom IDs (e.g., VIS-123456) for user, talent, or profile parameters
        if (["userId", "talentId", "profileId"].includes(name) && typeof val === "string" && val.startsWith("VIS-")) {
            return next();
        }
        return res.status(400).json({
            success: false,
            message: `Invalid identifier format for '${name}': ${val}`
        });
    }
    next();
};

export default {
    validateObjectId,
    validateObjectIdParam
};
