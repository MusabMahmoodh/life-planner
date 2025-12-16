/**
 * AuthGuard - Supabase JWT Authentication Guard
 *
 * @see BACKEND SPECIFICATION Section 4 - Authentication & Security
 * @see LLM INPUT CONTRACT Section 10 - Security Rules
 *
 * Responsibilities:
 * - Extract JWT from Authorization header or cookies
 * - Validate token via Supabase Auth
 * - Attach authenticated user to request context
 * - Reject unauthenticated requests (fail closed)
 *
 * Rules:
 * - No business logic
 * - No database access
 * - No AI calls
 * - Deny if uncertain
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { AuthenticatedUser } from '../decorators/user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT payload structure from Supabase Auth.
 * Only essential fields we need for authentication.
 */
export interface SupabaseJwtPayload {
  /** User ID (auth.uid()) */
  sub: string;
  /** User email */
  email?: string;
  /** Token expiration (Unix timestamp) */
  exp: number;
  /** Token issued at (Unix timestamp) */
  iat: number;
  /** Audience */
  aud: string;
  /** Role (e.g., 'authenticated') */
  role?: string;
}

/**
 * Authentication guard that validates Supabase JWT tokens.
 *
 * This guard:
 * 1. Extracts JWT from Authorization header (Bearer) or cookies
 * 2. Validates the token via Supabase Auth service
 * 3. Attaches the authenticated user to the request
 * 4. Rejects requests without valid authentication
 *
 * Fail-closed: If anything is uncertain, access is denied.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Determine if the request is allowed to proceed.
   *
   * @param context - Execution context
   * @returns true if authenticated, throws otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Extract token from request
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn('No authentication token provided');
      throw new UnauthorizedException('Authentication required');
    }

    try {
      // Validate token via Supabase Auth
      const payload = await this.supabaseAuth.verifyToken(token);

      if (!payload) {
        this.logger.warn('Token verification returned null');
        throw new UnauthorizedException('Invalid authentication token');
      }

      // Validate required fields
      if (!payload.sub) {
        this.logger.warn('Token missing user ID (sub)');
        throw new UnauthorizedException('Invalid token: missing user identifier');
      }

      // Check token expiration (defense in depth - Supabase should handle this)
      if (this.isTokenExpired(payload)) {
        this.logger.warn('Token has expired', { userId: payload.sub });
        throw new UnauthorizedException('Authentication token has expired');
      }

      // Attach authenticated user to request
      const authenticatedUser: AuthenticatedUser = {
        id: payload.sub,
        email: payload.email,
      };

      request.user = authenticatedUser;

      this.logger.debug('User authenticated', { userId: payload.sub });

      return true;
    } catch (error) {
      // If it's already an UnauthorizedException, rethrow it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Log unexpected errors and fail closed
      this.logger.error('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Extract JWT token from request.
   *
   * Priority:
   * 1. Authorization header (Bearer token)
   * 2. Cookie (sb-access-token or access_token)
   *
   * @param request - Express request
   * @returns Token string or undefined
   */
  private extractToken(request: Request): string | undefined {
    // Try Authorization header first (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token.length > 0) {
        return token;
      }
    }

    // Fall back to cookies
    // Supabase uses different cookie names depending on configuration
    const cookies = request.cookies as Record<string, string> | undefined;
    if (cookies) {
      // Check common Supabase cookie names
      const cookieToken =
        cookies['sb-access-token'] || cookies['access_token'] || cookies['supabase-auth-token'];

      if (cookieToken && cookieToken.length > 0) {
        return cookieToken;
      }
    }

    return undefined;
  }

  /**
   * Check if token has expired.
   * Defense in depth - Supabase should already validate this.
   *
   * @param payload - JWT payload
   * @returns true if expired
   */
  private isTokenExpired(payload: SupabaseJwtPayload): boolean {
    if (!payload.exp) {
      // No expiration = treat as expired (fail closed)
      return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const now = Math.floor(Date.now() / 1000);

    // Add small buffer (5 seconds) to account for clock skew
    return payload.exp < now - 5;
  }
}
