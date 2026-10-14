const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    getMyCreditBalance,
    getCreditHistory,
    getViewedTalents,
    unlockFullTalentProfile
} = require("../controllers/credit.controller");

const router = express.Router();

router.get(
    "/balance",
    authenticateUser,
    authorizeRoles("organization"),
    getMyCreditBalance
);

router.get(
    "/history",
    authenticateUser,
    authorizeRoles("organization"),
    getCreditHistory
);

router.get(
    "/viewed",
    authenticateUser,
    authorizeRoles("organization"),
    getViewedTalents
);

router.post(
    "/unlock/:talentIdOrVismayaId",
    authenticateUser,
    authorizeRoles("organization"),
    unlockFullTalentProfile
);

module.exports = router;
