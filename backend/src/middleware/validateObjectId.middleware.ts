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
            // Allow Vismaya custom IDs or string identifiers for user, talent, org, or profile parameters
            if (["userId", "talentId", "profileId", "id", "orgId"].includes(paramName) && typeof idValue === "string" && idValue.trim().length > 0) {
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
        // Allow Vismaya custom IDs or string identifiers for user, talent, org, or profile parameters
        if (["userId", "talentId", "profileId", "id", "orgId"].includes(name) && typeof val === "string" && val.trim().length > 0) {
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
