export const validateOpportunityCreate = (data: any): { isValid: boolean; errors: string[] } => {
    const {
        projectId,
        projectName,
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

    const errors: string[] = [];

    if (projectId !== undefined && (typeof projectId !== "string" || !projectId.trim())) {
        errors.push("Project ID must be a non-empty string");
    }
    if (projectName !== undefined && (typeof projectName !== "string" || !projectName.trim())) {
        errors.push("Project name must be a non-empty string");
    }
    const effectiveRole = role || (Array.isArray(data?.roles) && data.roles[0]?.roleName);
    if (!title || typeof title !== "string" || !title.trim()) errors.push("Title is required");
    if (!summary || typeof summary !== "string" || !summary.trim()) errors.push("Summary is required");
    if (!effectiveRole || typeof effectiveRole !== "string" || !effectiveRole.trim()) errors.push("Role title is mandatory");
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

export const validateOpportunityUpdate = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (data?.deadline) {
        const deadlineDate = new Date(data.deadline);
        if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
            errors.push("Deadline must be a valid future date");
        }
    }
    if (data?.positionsCount !== undefined) {
        const pCount = parseInt(data.positionsCount, 10);
        if (isNaN(pCount) || pCount < 1) {
            errors.push("Positions count must be at least 1");
        }
    }
    if (data?.projectId !== undefined && (typeof data.projectId !== "string" || !data.projectId.trim())) {
        errors.push("Project ID must be a non-empty string");
    }
    if (data?.projectName !== undefined && (typeof data.projectName !== "string" || !data.projectName.trim())) {
        errors.push("Project name must be a non-empty string");
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};

export default {
    validateOpportunityCreate,
    validateOpportunityUpdate
};
