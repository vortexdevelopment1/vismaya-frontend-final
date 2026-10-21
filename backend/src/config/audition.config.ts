/**
 * Audition Feature Flags & Upload Constraints
 * client may change these later
 */

export const AUDITION_CONFIG = {
    ENABLE_LIVE_AUDITION: false, // set to true when real-time audition feature is ready
    SELF_TAPE_MAX_FILE_MB: 50,
    SELF_TAPE_ALLOWED_TYPES: ["video/mp4", "video/quicktime", "video/webm"],
    SELF_TAPE_ALLOWED_EXTENSIONS: ["mp4", "mov", "webm"],
    SELF_TAPE_MAX_DURATION_MIN: 5,
    SELF_TAPE_MAX_VIDEOS_PER_AUDITION: 1
};

export default AUDITION_CONFIG;
