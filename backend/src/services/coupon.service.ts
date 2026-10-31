import Coupon from "../models/coupon.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";

/**
 * Validate coupon code and calculate discount amount
 */
export const validateAndApplyCoupon = async ({
    couponCode,
    packageType,
    orderAmount,
    userId,
    email
}: {
    couponCode?: string | null;
    packageType: any;
    orderAmount: number;
    userId?: string;
    email?: string;
}): Promise<{
    isValid: boolean;
    discountAmount: number;
    finalAmount: number;
    couponCode?: string;
    discountType?: "percentage" | "fixed" | string;
    discountValue?: number;
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

    // Check user eligibility (All Users vs Limited Users)
    if (coupon.userEligibility === "limited" && Array.isArray(coupon.applicableUsers) && coupon.applicableUsers.length > 0) {
        const normalizedEmail = email ? email.trim().toLowerCase() : "";
        const uId = userId ? String(userId) : "";
        const isEligible = coupon.applicableUsers.some((u: string) => {
            const clean = String(u).trim().toLowerCase();
            return clean === normalizedEmail || clean === uId;
        });
        if (!isEligible) {
            return {
                isValid: false,
                discountAmount: 0,
                finalAmount: orderAmount,
                message: "This coupon is reserved for specific accounts"
            };
        }
    }

    // Check per-user redemption limit
    if (coupon.maxUsesPerUser && (userId || email)) {
        try {
            const filter: any = {
                couponCode: cleanCode,
                status: "successful"
            };
            const orConditions: any[] = [];
            if (userId) orConditions.push({ userId });
            if (email) {
                orConditions.push({ email: email.trim().toLowerCase() });
                orConditions.push({ customerEmail: email.trim().toLowerCase() });
            }
            if (orConditions.length) {
                filter.$or = orConditions;
                const userUses = await PaymentTransaction.countDocuments(filter);
                if (userUses >= coupon.maxUsesPerUser) {
                    return {
                        isValid: false,
                        discountAmount: 0,
                        finalAmount: orderAmount,
                        message: `You have reached the redemption limit (${coupon.maxUsesPerUser}) for this coupon`
                    };
                }
            }
        } catch (txErr) {
            console.warn("User coupon redemption check warning:", txErr);
        }
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
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
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

/**
 * Automatically evaluates all active coupons and finds the single best eligible coupon providing the highest discount
 */
export const findBestEligibleCoupon = async ({
    packageType,
    orderAmount,
    userId,
    email
}: {
    packageType: any;
    orderAmount: number;
    userId?: string;
    email?: string;
}): Promise<any> => {
    try {
        const now = new Date();
        const activeCoupons = await Coupon.find({
            isActive: true,
            validFrom: { $lte: now },
            $or: [{ validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gte: now } }]
        }).sort({ createdAt: -1 });

        let bestCouponResult: any = null;
        let highestDiscount = 0;

        for (const coupon of activeCoupons) {
            const res = await validateAndApplyCoupon({
                couponCode: coupon.code,
                packageType,
                orderAmount,
                userId,
                email
            });

            if (res.isValid && res.discountAmount > highestDiscount) {
                highestDiscount = res.discountAmount;
                bestCouponResult = {
                    ...res,
                    code: coupon.code,
                    couponCode: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    description: coupon.discountType === "percentage"
                        ? `${coupon.discountValue}% platform discount`
                        : `₹${coupon.discountValue} promotional discount`
                };
            }
        }

        return bestCouponResult;
    } catch (err) {
        console.error("findBestEligibleCoupon error:", err);
        return null;
    }
};

export default {
    validateAndApplyCoupon,
    recordCouponUsage,
    findBestEligibleCoupon
};
