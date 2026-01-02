/**
 * @localpro/auth-access TypeScript Definitions
 */

export interface AuthConfig {
  issuer?: string;
  privateKey?: string;
  publicKey?: string;
  algorithm?: string;
  defaultExpiresIn?: string;
}

export interface TokenPayload {
  partnerId: string;
  role: string;
  scopes?: string[];
  [key: string]: any;
}

export interface TokenOptions {
  expiresIn?: string;
  audience?: string;
}

export interface AuthAccessInstance {
  tokenManager: TokenManager;
  scopeManager: ScopeManager;
}

import * as Express from 'express';

export interface ExpressRequest extends Express.Request {
  user?: TokenPayload;
  partnerId?: string;
  role?: string;
  scopes?: string[];
}

export interface AuthMiddlewareOptions {
  requiredScopes?: string | string[];
  requiredRole?: string;
}

export interface GraphQLContext {
  user?: TokenPayload;
  partnerId?: string;
  role?: string;
  scopes?: string[];
  tokenManager?: TokenManager;
  scopeManager?: ScopeManager;
}

/**
 * Token Manager Class
 */
export declare class TokenManager {
  constructor(config?: AuthConfig);
  issueToken(payload: TokenPayload, options?: TokenOptions): Promise<string>;
  validateToken(token: string, options?: TokenOptions): Promise<TokenPayload>;
  refreshToken(oldToken: string, options?: TokenOptions): Promise<string>;
  decodeToken(token: string): any;
}

/**
 * Scope Manager Class
 */
export declare class ScopeManager {
  constructor();
  getDefaultScopes(role: string): string[];
  checkScopes(tokenPayload: TokenPayload, requiredScopes: string | string[]): boolean;
  hasRole(userRole: string, requiredRole: string): boolean;
  isValidRole(role: string): boolean;
}

/**
 * Initialize auth access
 */
export function initAuth(config?: AuthConfig): AuthAccessInstance;

/**
 * Get auth access instance
 */
export function getAuthAccess(): AuthAccessInstance;

/**
 * Issue a token
 */
export function issueToken(payload: TokenPayload, options?: TokenOptions): Promise<string>;

/**
 * Validate a token
 */
export function validateToken(token: string, options?: TokenOptions): Promise<TokenPayload>;

/**
 * Check if token has required scopes
 */
export function checkScopes(tokenPayload: TokenPayload, scopes: string | string[]): boolean;

/**
 * Refresh a token
 */
export function refreshToken(oldToken: string, options?: TokenOptions): Promise<string>;

/**
 * Express Middleware
 */
export function authMiddleware(options?: AuthMiddlewareOptions): (
  req: ExpressRequest,
  res: Express.Response,
  next: Express.NextFunction
) => void | Promise<void>;

/**
 * Require specific scopes (Express)
 */
export function requireScopes(scopes: string | string[]): (
  req: ExpressRequest,
  res: Express.Response,
  next: Express.NextFunction
) => void | Promise<void>;

/**
 * Require specific role (Express)
 */
export function requireRole(role: string): (
  req: ExpressRequest,
  res: Express.Response,
  next: Express.NextFunction
) => void | Promise<void>;

/**
 * Fastify Auth Plugin
 */
export function authPlugin(options?: AuthMiddlewareOptions): any;

/**
 * Require specific scopes (Fastify)
 */
export function fastifyRequireScopes(scopes: string | string[]): any;

/**
 * Require specific role (Fastify)
 */
export function fastifyRequireRole(role: string): any;

/**
 * GraphQL Authentication Context
 */
export function authGraphQL(options?: Record<string, any>): (context: {
  req?: any;
  connection?: any;
}) => Promise<GraphQLContext | null>;

/**
 * Check scopes in GraphQL resolvers
 */
export function graphqlCheckScopes(context: GraphQLContext, requiredScopes: string | string[]): void;

/**
 * Check role in GraphQL resolvers
 */
export function graphqlCheckRole(context: GraphQLContext, requiredRole: string): void;

/**
 * Utility functions
 */
export namespace utils {
  function validateToken(token: string, authAccess: AuthAccessInstance): Promise<TokenPayload>;
  function checkScopes(tokenPayload: TokenPayload, scopes: string | string[], authAccess: AuthAccessInstance): boolean;
  function refreshToken(oldToken: string, authAccess: AuthAccessInstance, options?: TokenOptions): Promise<string>;
}

// Export classes for advanced usage
export { TokenManager, ScopeManager };

// CommonJS exports
export = {
  initAuth,
  getAuthAccess,
  issueToken,
  validateToken,
  checkScopes,
  refreshToken,
  authMiddleware,
  requireScopes,
  requireRole,
  authPlugin,
  fastifyRequireScopes,
  fastifyRequireRole,
  authGraphQL,
  graphqlCheckScopes,
  graphqlCheckRole,
  utils,
  TokenManager,
  ScopeManager
};
