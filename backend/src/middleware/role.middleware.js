const normalizeRole = (r) => (r === "recruiter" ? "organization" : r);

const authorizeRoles = (...allowedRoles) => {
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User is not authenticated"
            });
        }

        const userRole = normalizeRole(req.user.role);

        // Admins have full access across roles, or userRole matches allowed role
        if (userRole === "admin" || normalizedAllowed.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "You do not have permission to access this resource"
        });
    };
};

module.exports = {
    authorizeRoles
};