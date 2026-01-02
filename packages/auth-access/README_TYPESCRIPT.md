# TypeScript Support

`@localpro/auth-access` includes full TypeScript type definitions for use in TypeScript, React.js, and Next.js projects.

## Installation

```bash
npm install @localpro/auth-access
# or
yarn add @localpro/auth-access
```

## Usage in TypeScript

### Basic Setup

```typescript
import { initAuth, authMiddleware, requireRole } from '@localpro/auth-access';

// Initialize with type safety
const authAccess = initAuth({
  issuer: process.env.AUTH_ISSUER || 'localpro',
  publicKey: process.env.AUTH_PUBLIC_KEY,
  defaultExpiresIn: '1h'
});
```

### Express.js with TypeScript

```typescript
import express, { Request, Response, NextFunction } from 'express';
import { 
  initAuth, 
  authMiddleware, 
  requireRole,
  ExpressRequest 
} from '@localpro/auth-access';

const app = express();

// Initialize
const authAccess = initAuth({
  issuer: process.env.AUTH_ISSUER,
  publicKey: process.env.AUTH_PUBLIC_KEY
});

app.locals.authAccess = authAccess;

// Type-safe middleware
app.use(authMiddleware());

// Type-safe route handlers
app.get('/profile', authMiddleware(), (req: ExpressRequest, res: Response) => {
  // TypeScript knows about req.user, req.partnerId, req.role, req.scopes
  res.json({
    partnerId: req.partnerId,
    role: req.role,
    scopes: req.scopes,
    user: req.user
  });
});

// Role-based routes
app.get('/admin/data', requireRole('admin'), (req: ExpressRequest, res: Response) => {
  res.json({ data: 'admin content' });
});
```

### Next.js API Routes

```typescript
// pages/api/protected.ts or app/api/protected/route.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { initAuth, authMiddleware, ExpressRequest } from '@localpro/auth-access';

// Initialize once (e.g., in a separate config file)
const authAccess = initAuth({
  issuer: process.env.AUTH_ISSUER,
  publicKey: process.env.AUTH_PUBLIC_KEY
});

export default async function handler(
  req: ExpressRequest & NextApiRequest,
  res: NextApiResponse
) {
  // Apply auth middleware
  await new Promise<void>((resolve, reject) => {
    authMiddleware()(req as any, res as any, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // TypeScript knows req.user is available
  res.json({
    partnerId: req.partnerId,
    role: req.role,
    user: req.user
  });
}
```

### Next.js App Router (App Directory)

```typescript
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateToken, TokenPayload } from '@localpro/auth-access';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded: TokenPayload = await validateToken(token);
    
    return NextResponse.json({
      partnerId: decoded.partnerId,
      role: decoded.role,
      scopes: decoded.scopes
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}
```

### React.js with TypeScript

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { validateToken, TokenPayload } from '@localpro/auth-access';

export function useAuth() {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      validateToken(token)
        .then((decoded: TokenPayload) => {
          setUser(decoded);
          setLoading(false);
        })
        .catch(() => {
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}
```

### Token Issuance with TypeScript

```typescript
import { issueToken, TokenPayload, TokenOptions } from '@localpro/auth-access';

async function createToken(partnerId: string, role: string): Promise<string> {
  const payload: TokenPayload = {
    partnerId,
    role,
    scopes: ['read:services', 'write:services']
  };

  const options: TokenOptions = {
    expiresIn: '24h'
  };

  return await issueToken(payload, options);
}
```

### GraphQL with TypeScript

```typescript
import { ApolloServer } from 'apollo-server-express';
import { authGraphQL, GraphQLContext, graphqlCheckScopes } from '@localpro/auth-access';

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      analytics: (parent: any, args: any, context: GraphQLContext) => {
        if (!context.user) {
          throw new Error('Authentication required');
        }

        // Type-safe scope checking
        graphqlCheckScopes(context, ['read:analytics']);

        return {
          views: 1000,
          conversions: 50
        };
      }
    }
  },
  context: authGraphQL()
});
```

## Type Definitions

### Core Types

```typescript
interface TokenPayload {
  partnerId: string;
  role: string;
  scopes?: string[];
  [key: string]: any;
}

interface AuthConfig {
  issuer?: string;
  privateKey?: string;
  publicKey?: string;
  algorithm?: string;
  defaultExpiresIn?: string;
}

interface AuthMiddlewareOptions {
  requiredScopes?: string | string[];
  requiredRole?: string;
}
```

### Express Extensions

```typescript
interface ExpressRequest extends Express.Request {
  user?: TokenPayload;
  partnerId?: string;
  role?: string;
  scopes?: string[];
}
```

### GraphQL Context

```typescript
interface GraphQLContext {
  user?: TokenPayload;
  partnerId?: string;
  role?: string;
  scopes?: string[];
  tokenManager?: TokenManager;
  scopeManager?: ScopeManager;
}
```

## TypeScript Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Examples

See the `examples/` directory for TypeScript-compatible examples that work with React.js and Next.js projects.
