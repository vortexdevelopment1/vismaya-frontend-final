import { AuthUser } from "./index.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            id?: string;
            requestId?: string;
        }
    }
}

export {};
