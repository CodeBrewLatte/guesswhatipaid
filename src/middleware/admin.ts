import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AdminRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName?: string;
    hasUnlocked: boolean;
  };
}

export const adminMiddleware = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For MVP, we'll use a simple email-based admin check
    // In production, you'd want a proper admin role field in the User model
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    if (!adminEmails.includes(req.user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
