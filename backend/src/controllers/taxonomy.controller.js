const {
    OPEN_TALENT_PROFESSIONS,
    FILM_AND_TV_TAXONOMY,
    CAREER_STAGES,
    FAVOURITE_TAGS,
    getProfessionFormConfig
} = require("../config/taxonomy");

/**
 * Get all platform taxonomies for dynamic frontend dropdowns
 * GET /api/taxonomy
 */
const getTaxonomies = (req, res) => {
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
const getFavouriteTags = (req, res) => {
    res.status(200).json({
        success: true,
        tags: FAVOURITE_TAGS
    });
};

/**
 * Get dynamic form schema & portfolio minimums for a specific profession
 * GET /api/taxonomy/:profession/form
 */
const getProfessionForm = (req, res) => {
    const { profession } = req.params;
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

module.exports = {
    getTaxonomies,
    getFavouriteTags,
    getProfessionForm
};

