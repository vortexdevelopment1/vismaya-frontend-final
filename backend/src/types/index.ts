export interface AuthUser {
    userId: string;
    role: string;
    email: string;
    status: string;
    isPaid?: boolean;
    sessionId?: string | null;
}

export interface JwtCustomPayload {
    userId: string;
    role?: string;
    sessionId?: string | null;
    email?: string;
    iat?: number;
    exp?: number;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    meta?: Record<string, unknown>;
}
