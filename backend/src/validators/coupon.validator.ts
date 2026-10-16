export const validateCouponInput = (data: any): { isValid: boolean; errors: string[] } => {
    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, applicablePackages, maxUses, validUntil } = data || {};
    const errors: string[] = [];

    if (!code || typeof code !== "string" || !code.trim()) {
        errors.push("Coupon code is required");
    }

    if (!discountType || !["percentage", "fixed"].includes(discountType)) {
        errors.push("Discount type must be 'percentage' or 'fixed'");
    }

    if (discountValue === undefined || typeof discountValue !== "number" || discountValue <= 0) {
        errors.push("Discount value must be a positive number");
    } else if (discountType === "percentage" && discountValue > 100) {
        errors.push("Percentage discount cannot exceed 100%");
    }

    if (minOrderAmount !== undefined && (typeof minOrderAmount !== "number" || minOrderAmount < 0)) {
        errors.push("Minimum order amount must be a non-negative number");
    }

    if (maxDiscountAmount !== undefined && (typeof maxDiscountAmount !== "number" || maxDiscountAmount <= 0)) {
        errors.push("Maximum discount amount must be a positive number");
    }

    if (validUntil) {
        const untilDate = new Date(validUntil);
        if (isNaN(untilDate.getTime())) {
            errors.push("Valid until date is invalid");
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export default {
    validateCouponInput
};
