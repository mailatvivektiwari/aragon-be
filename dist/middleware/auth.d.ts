import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name?: string;
    };
}
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkResourceOwnership: (resourceType: "board" | "task" | "column") => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export type { AuthenticatedRequest };
//# sourceMappingURL=auth.d.ts.map