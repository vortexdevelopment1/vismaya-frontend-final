import express, { Router, Request, Response, NextFunction } from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "Vismaya backend is running"
    });
});

export default router;