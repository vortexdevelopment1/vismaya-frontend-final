import Coupon from "../models/coupon.model.js";

/**
 * Validate coupon code and calculate discount amount
 */
export const validateAndApplyCoupon = async ({
    couponCode,
    packageType,
    orderAmount
}: {
    couponCode?: string | null;
    packageType: any;
    orderAmount: number;
}): Promise<{
    isValid: boolean;
    discountAmount: number;
    finalAmount: number;
    couponCode?: string;
    couponId?: any;
    message: string;
}> => {
    if (!couponCode) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount,
            message: "No coupon provided"
        };
    }

    const cleanCode = String(couponCode).trim().toUpperCase();
    const coupon = await Coupon.findOne({
        code: cleanCode,
        isActive: true
    });

    if (!coupon) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount,
            message: "Invalid or inactive coupon code"
        };
    }

    // Check validity window
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount,
            message: "Coupon is not yet active"
        };
    }

    if (coupon.validUntil && now > coupon.validUntil) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount,
            message: "Coupon has expired"
        };
    }

    // Check usage limits
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount,
            message: "Coupon usage limit has been reached"
        };
    }

    // Check package eligibility
    if (coupon.applicablePackages && coupon.applicablePackages.length > 0) {
        if (!coupon.applicablePackages.includes(packageType)) {
            return {
                isValid: false,
                discountAmount: 0,
                finalAmount: orderAmount,
                message: `Coupon is not applicable for ${packageType}`
            };
        }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
        return {
            isValid: false,
            discountAmount: 0,
            finalAmount: orderAmount,
            message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
        };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
        discountAmount = Math.round((orderAmount * coupon.discountValue) / 100);
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
        }
    } else if (coupon.discountType === "fixed") {
        discountAmount = Math.min(coupon.discountValue, orderAmount);
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return {
        isValid: true,
        couponCode: cleanCode,
        discountAmount,
        finalAmount,
        couponId: coupon._id,
        message: `Coupon applied successfully. You saved ₹${discountAmount}!`
    };
};

/**
 * Record successful coupon usage
 */
export const recordCouponUsage = async (couponCode?: string | null): Promise<void> => {
    if (!couponCode) return;
    try {
        await Coupon.findOneAndUpdate(
            { code: String(couponCode).trim().toUpperCase() },
            { $inc: { currentUses: 1 } }
        );
    } catch (err) {
        console.error("Record coupon usage error:", err);
    }
};

export default {
    validateAndApplyCoupon,
    recordCouponUsage
};
