import { Request, Response } from "express";
import {
    OPEN_TALENT_PROFESSIONS,
    FILM_AND_TV_TAXONOMY,
    CAREER_STAGES,
    FAVOURITE_TAGS,
    getProfessionFormConfig
} from "../config/taxonomy.js";

/**
 * Get all platform taxonomies for dynamic frontend dropdowns
 * GET /api/taxonomy
 */
export const getTaxonomies = (req: Request, res: Response): void => {
    res.status(200).json({
        success: true,
        data: {
            openTalent: {
                professions: OPEN_TALENT_PROFESSIONS,
                maxSecondaryProfessions: 3
            },
            filmAndTv: {
                departments: FILM_AND_TV_TAXONOMY,
                maxSecondaryDepartments: 2
            },
            careerStages: CAREER_STAGES,
            favouriteTags: FAVOURITE_TAGS
        }
    });
};

/**
 * Get Vismaya-defined favourite tags
 * GET /api/taxonomy/favourite-tags
 */
export const getFavouriteTags = (req: Request, res: Response): void => {
    res.status(200).json({
        success: true,
        tags: FAVOURITE_TAGS
    });
};

/**
 * Get dynamic form schema & portfolio minimums for a specific profession
 * GET /api/taxonomy/:profession/form
 */
export const getProfessionForm = (req: Request, res: Response): any => {
    const profession = String(req.params.profession);
    const config = getProfessionFormConfig(profession);
    if (!config) {
        return res.status(404).json({
            success: false,
            message: `Form configuration for profession '${profession}' not found.`
        });
    }

    res.status(200).json({
        success: true,
        profession,
        formConfig: config
    });
};

export default {
    getTaxonomies,
    getFavouriteTags,
    getProfessionForm
};
