const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    submitIdentityVerification,
    submitProfessionalVerification,
    submitBusinessVerification,
    getMyVerifications
} = require("../controllers/verification.controller");

const router = express.Router();

router.post(
    "/identity",
    authenticateUser,
    submitIdentityVerification
);

router.post(
    "/professional",
    authenticateUser,
    authorizeRoles("talent"),
    submitProfessionalVerification
);

router.post(
    "/business",
    authenticateUser,
    authorizeRoles("organization"),
    submitBusinessVerification
);

router.get(
    "/my",
    authenticateUser,
    getMyVerifications
);

module.exports = router;
