// Koa middleware
export function koaLicenseMiddleware(options?: ValidateLicenseOptions): any;
export function generateLicense(payload: any, options?: { sign?: boolean, secretOrPrivateKey?: string, algorithm?: string }): string | object;
export function revokeLicenseRemote(licenseKey: string, options: RevocationOptions): Promise<boolean>;
export function inspectLicense(license: string | object, options?: { secretOrPublicKey?: string }): object;
export interface RevocationOptions {
  endpoint: string;
  method?: string;
  headers?: Record<string, string>;
}

export function isLicenseRevokedRemote(licenseKey: string, options: RevocationOptions): Promise<boolean>;
export interface JWTLicenseOptions {
  secretOrPublicKey: string;
  algorithms?: string[];
}

export function validateLicenseJWT(token: string, options: JWTLicenseOptions): ValidateLicenseResult;
// TypeScript typings for License Management SDK


export interface ValidateLicenseOptions {
  expiry?: string;
  issuer?: string;
  remote?: RemoteLicenseOptions;
  logger?: (info: any) => void;
}

export interface RemoteLicenseOptions {
  endpoint: string;
  method?: string;
  headers?: Record<string, string>;
}

export interface ValidateLicenseResult {
  isValid: boolean;
  reason: string;
  meta: any;
}


export function validateLicense(licenseKey: string, options?: ValidateLicenseOptions): ValidateLicenseResult;
export function validateLicenseRemote(licenseKey: string, options: RemoteLicenseOptions): Promise<ValidateLicenseResult>;

import { Request, Response, NextFunction } from 'express';

export function licenseMiddleware(options?: ValidateLicenseOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
