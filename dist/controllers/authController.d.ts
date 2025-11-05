import { Request, Response } from 'express';
export declare const sendMagicLink: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const verifyMagicLink: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getCurrentUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const cleanupExpiredMagicLinks: () => Promise<void>;
//# sourceMappingURL=authController.d.ts.map