/**
 * Utility functions for timezone-aware date calculations.
 * Vismaya opportunities and auditions operate on Asia/Kolkata (UTC+05:30) date boundaries.
 */

/**
 * Returns the end of the calendar day (23:59:59.999) in Asia/Kolkata timezone as a UTC Date object.
 */
export const getKolkataEndOfDay = (deadlineInput: Date | string): Date => {
    let y: number;
    let m: number;
    let d: number;

    if (typeof deadlineInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(deadlineInput.trim())) {
        const parts = deadlineInput.trim().split("-");
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
    } else {
        const dateObj = new Date(deadlineInput);
        if (isNaN(dateObj.getTime())) {
            return new Date(NaN);
        }
        const kolkataDateStr = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(dateObj);
        const parts = kolkataDateStr.split("-");
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
    }

    // 23:59:59.999 in Asia/Kolkata (UTC+5:30) corresponds to 18:29:59.999 UTC of the same calendar day.
    return new Date(Date.UTC(y, m - 1, d, 18, 29, 59, 999));
};

/**
 * Returns the start of the calendar day (00:00:00.000) in Asia/Kolkata timezone as a UTC Date object.
 */
export const getKolkataStartOfDay = (dateInput: Date | string): Date => {
    let y: number;
    let m: number;
    let d: number;

    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
        const parts = dateInput.trim().split("-");
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
    } else {
        const dateObj = new Date(dateInput);
        if (isNaN(dateObj.getTime())) {
            return new Date(NaN);
        }
        const kolkataDateStr = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(dateObj);
        const parts = kolkataDateStr.split("-");
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
    }

    // 00:00:00.000 in Asia/Kolkata (UTC+5:30) corresponds to 18:30:00.000 UTC of the previous calendar day.
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
};

/**
 * Checks if a given deadline has passed.
 * Returns true if current time exceeds the end of the deadline date in Asia/Kolkata.
 * Null-safe: returns false if deadline is missing or invalid.
 */
export const isDeadlineExpired = (deadline: Date | string | null | undefined, now: Date = new Date()): boolean => {
    if (!deadline) return false;
    const endOfDay = getKolkataEndOfDay(deadline);
    if (isNaN(endOfDay.getTime())) return false;
    return now.getTime() > endOfDay.getTime();
};
