interface IKycSession {
    refId: string;
    userId: string;
    attempts: number;
    expiresAt: number;
    completed: boolean;
    createdAt: number;
}

interface IUserRateHistory {
    triggers: number[];
}

class KycSessionStore {
    private sessions: Map<string, IKycSession> = new Map();
    private userRateMap: Map<string, IUserRateHistory> = new Map();

    constructor() {
        // Clean up expired sessions every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    public checkRateLimit(userId: string): { allowed: boolean; waitSeconds?: number; message?: string } {
        const now = Date.now();
        const history = this.userRateMap.get(userId) || { triggers: [] };

        // Filter triggers from last 1 hour
        const oneHourAgo = now - 60 * 60 * 1000;
        history.triggers = history.triggers.filter((t) => t > oneHourAgo);

        // Cooldown check (60s between triggers)
        const lastTrigger = history.triggers[history.triggers.length - 1];
        if (lastTrigger && now - lastTrigger < 60 * 1000) {
            const waitSeconds = Math.ceil((60 * 1000 - (now - lastTrigger)) / 1000);
            return {
                allowed: false,
                waitSeconds,
                message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`
            };
        }

        // Max 3 triggers per hour
        if (history.triggers.length >= 3) {
            return {
                allowed: false,
                message: "Maximum OTP request limit reached (3 per hour). Please try again later."
            };
        }

        return { allowed: true };
    }

    public recordTrigger(userId: string): void {
        const history = this.userRateMap.get(userId) || { triggers: [] };
        history.triggers.push(Date.now());
        this.userRateMap.set(userId, history);
    }

    public createSession(refId: string, userId: string, ttlMinutes = 10): void {
        const now = Date.now();
        this.sessions.set(refId, {
            refId,
            userId,
            attempts: 0,
            expiresAt: now + ttlMinutes * 60 * 1000,
            completed: false,
            createdAt: now,
        });
    }

    public getSession(refId: string): IKycSession | undefined {
        const session = this.sessions.get(refId);
        if (!session) return undefined;
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(refId);
            return undefined;
        }
        return session;
    }

    public recordAttempt(refId: string): number {
        const session = this.sessions.get(refId);
        if (!session) return 0;
        session.attempts += 1;
        return session.attempts;
    }

    public completeSession(refId: string): void {
        const session = this.sessions.get(refId);
        if (session) {
            session.completed = true;
        }
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, session] of this.sessions.entries()) {
            if (now > session.expiresAt || session.completed) {
                this.sessions.delete(key);
            }
        }
    }
}

export const kycSessionStore = new KycSessionStore();
