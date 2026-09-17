import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "./prisma.js";

// Extend Express Request to include our user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_me_in_prod";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  
  if (!token) {
    res.status(401).json({ error: "Authentication required. Missing token." });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    
    // Optional: Check if user still exists and is active
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { isActive: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "User is inactive or deleted." });
      return;
    }

    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Access denied. Insufficient permissions." });
      return;
    }
    
    next();
  };
};
