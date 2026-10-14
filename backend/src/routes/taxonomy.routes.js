const express = require("express");
const {
    getTaxonomies,
    getFavouriteTags,
    getProfessionForm
} = require("../controllers/taxonomy.controller");

const router = express.Router();

router.get("/", getTaxonomies);
router.get("/favourite-tags", getFavouriteTags);
router.get("/:profession/form", getProfessionForm);
router.get("/forms/:profession", getProfessionForm);

module.exports = router;

