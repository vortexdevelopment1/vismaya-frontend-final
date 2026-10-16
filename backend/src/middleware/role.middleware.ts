import { Request, Response, NextFunction, RequestHandler } from "express";

const normalizeRole = (r?: string): string | undefined => (r === "recruiter" ? "organization" : r);

export const authorizeRoles = (...allowedRoles: string[]): RequestHandler => {
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    return (req: Request, res: Response, next: NextFunction): any => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User is not authenticated"
            });
        }

        const userRole = normalizeRole(req.user.role);

        // Admins have full access across roles, or userRole matches allowed role
        if (userRole === "admin" || (userRole && normalizedAllowed.includes(userRole))) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "You do not have permission to access this resource"
        });
    };
};

export const requireSuperAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "User is not authenticated"
        });
    }

    if (req.user.role === "admin" && (req.user.isSuperAdmin === true || (req.user as any).superAdmin === true)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Super-admin privileges required for this action"
    });
};

export default {
    authorizeRoles,
    requireSuperAdmin
};
