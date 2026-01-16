# @localpro/auth-access

Shared authentication & authorization middleware for LocalPro services.

**Full TypeScript support included** - Works seamlessly with React.js, Next.js, and TypeScript projects.

## Features

- ✅ JWT token management with RS256 (asymmetric signing)
- ✅ Role-Based Access Control (RBAC) with scopes
- ✅ Express.js middleware
- ✅ Fastify middleware
- ✅ GraphQL/Apollo Server integration
- ✅ Token refresh flows

## Installation

```bash
npm install @localpro/auth-access
```

### TypeScript Support

Full TypeScript definitions are included. No additional `@types` package needed!

```typescript
import { initAuth, authMiddleware, TokenPayload } from '@localpro/auth-access';
```

The package works seamlessly with TypeScript, React.js, and Next.js projects. All exports are fully typed for better IDE support and type safety.

## Quick Start

### 1. Initialize

```javascript
const { initAuth } = require('@localpro/auth-access');

// Initialize once at app startup
initAuth({
  issuer: process.env.AUTH_ISSUER || 'localpro',
  privateKey: process.env.AUTH_PRIVATE_KEY, // For issuing tokens
  publicKey: process.env.AUTH_PUBLIC_KEY,   // For validating tokens
  defaultExpiresIn: '1h'
});
```

### 2. Express.js Usage

**JavaScript:**
```javascript
const express = require('express');
const { initAuth, authMiddleware, requireRole } = require('@localpro/auth-access');

const app = express();

// Initialize and attach to app
const authAccess = initAuth({
  issuer: process.env.AUTH_ISSUER,
  publicKey: process.env.AUTH_PUBLIC_KEY
});

app.locals.authAccess = authAccess;

// Apply to all routes
app.use(authMiddleware());

// Or apply to specific routes with role requirements
app.get('/admin/data', requireRole('admin'), (req, res) => {
  res.json({ data: 'admin content', user: req.user });
});

// Access user info
app.get('/profile', authMiddleware(), (req, res) => {
  res.json({
    partnerId: req.partnerId,
    role: req.role,
    scopes: req.scopes
  });
});
```

**TypeScript:**
```typescript
import express, { Response } from 'express';
import { 
  initAuth, 
  authMiddleware, 
  requireRole,
  ExpressRequest 
} from '@localpro/auth-access';

const app = express();

// Initialize with type safety
const authAccess = initAuth({
  issuer: process.env.AUTH_ISSUER,
  publicKey: process.env.AUTH_PUBLIC_KEY
});

app.locals.authAccess = authAccess;

// Type-safe middleware
app.use(authMiddleware());

// Type-safe route handlers - TypeScript knows about req.user, req.partnerId, etc.
app.get('/profile', authMiddleware(), (req: ExpressRequest, res: Response) => {
  res.json({
    partnerId: req.partnerId,  // TypeScript autocomplete works!
    role: req.role,
    scopes: req.scopes,
    user: req.user
  });
});

// Role-based routes with type safety
app.get('/admin/data', requireRole('admin'), (req: ExpressRequest, res: Response) => {
  res.json({ data: 'admin content', user: req.user });
});
```

### 3. Fastify Usage

```javascript
const fastify = require('fastify');
const { initAuth, authPlugin } = require('@localpro/auth-access');

const app = fastify();

// Initialize
const authAccess = initAuth({
  issuer: process.env.AUTH_ISSUER,
  publicKey: process.env.AUTH_PUBLIC_KEY,
});

// Attach to Fastify instance
app.decorate('authAccess', authAccess);

// Register auth plugin
app.register(authPlugin());

// Routes automatically have access to request.user
app.get('/profile', async (request, reply) => {
  return {
    partnerId: request.partnerId,
    role: request.role,
    scopes: request.scopes
  };
});
```

### 4. GraphQL/Apollo Server Usage

**JavaScript:**
```javascript
const { ApolloServer } = require('apollo-server-express');
const { initAuth, authGraphQL } = require('@localpro/auth-access');

// Initialize
initAuth({
  issuer: process.env.AUTH_ISSUER,
  publicKey: process.env.AUTH_PUBLIC_KEY
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authGraphQL()
});

// In resolvers
const resolvers = {
  Query: {
    myData: (parent, args, context) => {
      if (!context || !context.user) {
        throw new Error('Authentication required');
      }
      
      return {
        partnerId: context.partnerId,
        data: 'your data here'
      };
    }
  }
};
```

**TypeScript:**
```typescript
import { ApolloServer } from 'apollo-server-express';
import { initAuth, authGraphQL, GraphQLContext, graphqlCheckScopes } from '@localpro/auth-access';

// Initialize
initAuth({
  issuer: process.env.AUTH_ISSUER,
  publicKey: process.env.AUTH_PUBLIC_KEY
});

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      myData: (parent: any, args: any, context: GraphQLContext) => {
        if (!context || !context.user) {
          throw new Error('Authentication required');
        }
        
        // Type-safe access to context properties
        return {
          partnerId: context.partnerId,
          role: context.role,
          scopes: context.scopes,
          data: 'your data here'
        };
      },
      analytics: (parent: any, args: any, context: GraphQLContext) => {
        // Type-safe scope checking
        graphqlCheckScopes(context, ['read:analytics']);
        return { views: 1000, conversions: 50 };
      }
    }
  },
  context: authGraphQL()
});
```

### 5. Next.js Usage

**API Routes (Pages Router):**
```typescript
// pages/api/protected.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateToken, TokenPayload } from '@localpro/auth-access';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded: TokenPayload = await validateToken(token);
    return res.json({
      partnerId: decoded.partnerId,
      role: decoded.role,
      scopes: decoded.scopes
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**App Router:**
```typescript
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateToken, TokenPayload } from '@localpro/auth-access';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

### 6. React.js Usage

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

## API Reference

### Initialization

#### `initAuth(config)`

Initialize the auth access system.

**Parameters:**
- `config.issuer` (string, optional): Token issuer (default: 'localpro')
- `config.privateKey` (string, optional): Private key for signing tokens
- `config.publicKey` (string, optional): Public key for verifying tokens
- `config.algorithm` (string, optional): JWT algorithm (default: 'RS256')
- `config.defaultExpiresIn` (string, optional): Default token expiration (default: '1h')

**Returns:** Auth access instance

### Token Management

#### `issueToken(payload, options)`

Issue a new JWT access token.

**JavaScript:**
```javascript
const { issueToken } = require('@localpro/auth-access');

const token = await issueToken({
  partnerId: 'partner-123',
  role: 'partner:premium',
  scopes: ['read:analytics', 'write:services']
}, {
  expiresIn: '2h'
});
```

**TypeScript:**
```typescript
import { issueToken, TokenPayload, TokenOptions } from '@localpro/auth-access';

const payload: TokenPayload = {
  partnerId: 'partner-123',
  role: 'partner:premium',
  scopes: ['read:analytics', 'write:services']
};

const options: TokenOptions = {
  expiresIn: '2h'
};

const token = await issueToken(payload, options);
```

**Parameters:**
- `payload.partnerId` (string, required): Partner ID
- `payload.role` (string, required): Role (client, partner:basic, partner:premium, admin)
- `payload.scopes` (string[], optional): Additional scopes
- `options.expiresIn` (string, optional): Expiration time

**Returns:** JWT token string

#### `validateToken(token, options)`

Validate and decode a JWT token.

**JavaScript:**
```javascript
const { validateToken } = require('@localpro/auth-access');

try {
  const decoded = await validateToken(token);
  console.log(decoded.partnerId, decoded.role);
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

**TypeScript:**
```typescript
import { validateToken, TokenPayload } from '@localpro/auth-access';

try {
  const decoded: TokenPayload = await validateToken(token);
  console.log(decoded.partnerId, decoded.role, decoded.scopes);
} catch (error) {
  console.error('Invalid token:', error);
}
```

**Returns:** Decoded token payload

#### `refreshToken(oldToken, options)`

Refresh a token (issue new token with same payload but new expiration).

```javascript
const { refreshToken } = require('@localpro/auth-access');

const newToken = await refreshToken(oldToken, {
  expiresIn: '1h'
});
```

### Scope Management

#### `checkScopes(tokenPayload, scopes)`

Check if token has required scopes.

**JavaScript:**
```javascript
const { validateToken, checkScopes } = require('@localpro/auth-access');

const decoded = await validateToken(token);
if (!checkScopes(decoded, ['read:analytics'])) {
  throw new Error('Insufficient permissions');
}
```

**TypeScript:**
```typescript
import { validateToken, checkScopes, TokenPayload } from '@localpro/auth-access';

const decoded: TokenPayload = await validateToken(token);
if (!checkScopes(decoded, ['read:analytics'])) {
  throw new Error('Insufficient permissions');
}
```

**Returns:** boolean

### Express Middleware

#### `authMiddleware(options)`

Create Express authentication middleware.

**JavaScript:**
```javascript
const { authMiddleware } = require('@localpro/auth-access');

// Basic usage
app.use(authMiddleware());

// With options
app.use(authMiddleware({
  requiredScopes: ['read:services'],
  requiredRole: 'partner:premium'
}));
```

**TypeScript:**
```typescript
import { authMiddleware, ExpressRequest } from '@localpro/auth-access';
import { Response } from 'express';

// Basic usage
app.use(authMiddleware());

// With options and type-safe request
app.use(authMiddleware({
  requiredScopes: ['read:services'],
  requiredRole: 'partner:premium'
}));

// Type-safe route handler
app.get('/profile', authMiddleware(), (req: ExpressRequest, res: Response) => {
  // TypeScript knows req.user, req.partnerId, req.role, req.scopes
  res.json({ partnerId: req.partnerId, role: req.role });
});
```


#### `requireScopes(scopes)`

Require specific scopes.

```javascript
const { requireScopes } = require('@localpro/auth-access');

app.get('/analytics', requireScopes(['read:analytics']), (req, res) => {
  res.json({ analytics: 'data' });
});
```

#### `requireRole(role)`

Require specific role.

```javascript
const { requireRole } = require('@localpro/auth-access');

app.get('/admin/users', requireRole('admin'), (req, res) => {
  res.json({ users: [] });
});
```

### GraphQL Helpers

#### `checkScopes(context, requiredScopes)`

Check scopes in GraphQL resolvers.

**JavaScript:**
```javascript
const { graphqlCheckScopes } = require('@localpro/auth-access');

const resolvers = {
  Query: {
    analytics: (parent, args, context) => {
      graphqlCheckScopes(context, ['read:analytics']);
      return { data: 'analytics' };
    }
  }
};
```

**TypeScript:**
```typescript
import { graphqlCheckScopes, GraphQLContext } from '@localpro/auth-access';

const resolvers = {
  Query: {
    analytics: (parent: any, args: any, context: GraphQLContext) => {
      graphqlCheckScopes(context, ['read:analytics']);
      return { data: 'analytics' };
    }
  }
};
```

#### `checkRole(context, requiredRole)`

Check role in GraphQL resolvers.

**JavaScript:**
```javascript
const { graphqlCheckRole } = require('@localpro/auth-access');

const resolvers = {
  Query: {
    adminData: (parent, args, context) => {
      graphqlCheckRole(context, 'admin');
      return { data: 'admin data' };
    }
  }
};
```

**TypeScript:**
```typescript
import { graphqlCheckRole, GraphQLContext } from '@localpro/auth-access';

const resolvers = {
  Query: {
    adminData: (parent: any, args: any, context: GraphQLContext) => {
      graphqlCheckRole(context, 'admin');
      return { data: 'admin data' };
    }
  }
};
```


## Roles and Scopes

### Supported Roles

- `client` - Basic client access
- `partner:basic` - Basic partner access
- `partner:premium` - Premium partner access
- `admin` - Administrative access (all scopes)

### Default Scopes by Role

- **client**: `read:own`, `write:own`
- **partner:basic**: `read:own`, `write:own`, `read:services`, `write:services`
- **partner:premium**: All basic scopes + `read:analytics`, `write:analytics`
- **admin**: `*` (all scopes)

### Custom Scopes

You can add custom scopes when issuing tokens:

```javascript
const token = await issueToken({
  partnerId: 'partner-123',
  role: 'partner:premium',
  scopes: ['custom:scope1', 'custom:scope2']
});
```

## Security Best Practices

1. **Use RS256 (Asymmetric Keys)**: Always use RS256 for signing tokens
2. **Rotate Keys Safely**: Implement key rotation strategy
3. **Validate on Every Request**: Never skip token validation
5. **Log Failed Auth Attempts**: Monitor and log authentication failures
6. **Set Appropriate Expiration**: Use short-lived tokens (1h default)
7. **Use HTTPS**: Always use HTTPS in production

## Environment Variables

```bash
AUTH_ISSUER=localpro
AUTH_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
AUTH_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...
```

## Error Handling

The middleware throws specific errors:

- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions or wrong role

```javascript
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  next(err);
});
```

## Examples

### Express App with Multiple Middleware

```javascript
const express = require('express');
const { initAuth, authMiddleware, requireRole } = require('@localpro/auth-access');

const app = express();

// Initialize
const authAccess = initAuth({
  issuer: process.env.AUTH_ISSUER,
  publicKey: process.env.AUTH_PUBLIC_KEY,
});
app.locals.authAccess = authAccess;

// Public routes
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Protected routes
app.use('/api', authMiddleware());

// Tier-specific routes
app.get('/api/premium', requireRole('partner:premium'), (req, res) => {
  res.json({ data: 'premium' });
});

// Role-specific routes
app.get('/api/admin', requireRole('admin'), (req, res) => {
  res.json({ data: 'admin' });
});

app.listen(3000);
```

### Token Issuance Service

```javascript
const { initAuth, issueToken } = require('@localpro/auth-access');

// Initialize with private key for signing
initAuth({
  issuer: 'localpro',
  privateKey: process.env.AUTH_PRIVATE_KEY
});

// Issue token for partner
async function createPartnerToken(partnerId, role, scopes = []) {
  return await issueToken({
    partnerId,
    role,
    scopes
  }, {
    expiresIn: '24h'
  });
}
```

## License

MIT

## Support

For issues and questions, please contact support or open an issue on GitHub.
