const validateOpportunityCreate = (data) => {
    const {
        projectId,
        title,
        summary,
        role,
        location,
        deadline,
        remuneration,
        positionsCount,
        eligibility,
        customQuestions
    } = data || {};

    const errors = [];

    if (!projectId) errors.push("Project ID is required");
    if (!title || typeof title !== "string" || !title.trim()) errors.push("Title is required");
    if (!summary || typeof summary !== "string" || !summary.trim()) errors.push("Summary is required");
    if (!role || typeof role !== "string" || !role.trim()) errors.push("Role title is mandatory");
    if (!location || typeof location !== "string" || !location.trim()) errors.push("Location is required");

    if (!deadline) {
        errors.push("Deadline is required");
    } else {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
            errors.push("Deadline must be a valid future date");
        }
    }

    if (positionsCount !== undefined) {
        const pCount = parseInt(positionsCount, 10);
        if (isNaN(pCount) || pCount < 1) {
            errors.push("Positions count must be at least 1");
        }
    }

    if (customQuestions !== undefined && !Array.isArray(customQuestions)) {
        errors.push("Custom questions must be an array");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateOpportunityUpdate = (data) => {
    const errors = [];
    if (data.deadline) {
        const deadlineDate = new Date(data.deadline);
        if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
            errors.push("Deadline must be a valid future date");
        }
    }
    if (data.positionsCount !== undefined) {
        const pCount = parseInt(data.positionsCount, 10);
        if (isNaN(pCount) || pCount < 1) {
            errors.push("Positions count must be at least 1");
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    validateOpportunityCreate,
    validateOpportunityUpdate
};
