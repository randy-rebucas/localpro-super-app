/**
 * TypeScript Example
 * Demonstrates how to use @localpro/auth-access in TypeScript projects
 */

import express, { Request, Response } from 'express';
import {
  initAuth,
  authMiddleware,
  requireRole,
  requireScopes,
  issueToken,
  validateToken,
  TokenPayload,
  ExpressRequest,
  AuthConfig
} from '@localpro/auth-access';

const app = express();
app.use(express.json());

// Initialize with type safety
const config: AuthConfig = {
  issuer: process.env.AUTH_ISSUER || 'localpro',
  publicKey: process.env.AUTH_PUBLIC_KEY,
  defaultExpiresIn: '1h'
};

const authAccess = initAuth(config);
app.locals.authAccess = authAccess;

// Type-safe route with ExpressRequest
app.get('/profile', authMiddleware(), (req: ExpressRequest, res: Response) => {
  // TypeScript knows about these properties
  res.json({
    partnerId: req.partnerId,
    role: req.role,
    scopes: req.scopes,
    user: req.user
  });
});

// Role-based route
app.get('/admin/data', requireRole('admin'), (req: ExpressRequest, res: Response) => {
  res.json({ data: 'admin content' });
});

// Scope-based route
app.get('/analytics', requireScopes(['read:analytics']), (req: ExpressRequest, res: Response) => {
  res.json({ analytics: 'data' });
});

// Token issuance example
async function createTokenExample() {
  const payload: TokenPayload = {
    partnerId: 'partner-123',
    role: 'partner:premium',
    scopes: ['read:analytics', 'write:services']
  };

  const token = await issueToken(payload, { expiresIn: '24h' });
  console.log('Token:', token);
}

// Token validation example
async function validateTokenExample(token: string) {
  try {
    const decoded: TokenPayload = await validateToken(token);
    console.log('Decoded:', decoded);
  } catch (error) {
    console.error('Invalid token:', error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
