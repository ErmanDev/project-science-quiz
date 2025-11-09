// middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 1) Try cookie
    const tokenFromCookie = (req as any).cookies?.token;

    // 2) Or Authorization header
    const auth = req.header('Authorization');
    const tokenFromHeader = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;

    const token = tokenFromCookie || tokenFromHeader;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
