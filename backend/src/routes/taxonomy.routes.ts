import express, { Router, Request, Response, NextFunction } from "express";
import { 
    getTaxonomies,
    getFavouriteTags,
    getProfessionForm
 } from "../controllers/taxonomy.controller.js";

const router = express.Router();

router.get("/", getTaxonomies);
router.get("/favourite-tags", getFavouriteTags);
router.get("/:profession/form", getProfessionForm);
router.get("/forms/:profession", getProfessionForm);

export default router;

