/**
 * Supabase Auth Service
 *
 * @see BACKEND SPECIFICATION Section 4 - Authentication & Security
 *
 * Responsibilities:
 * - Verify Supabase JWT tokens
 * - Extract user identity from tokens
 *
 * Rules:
 * - No business logic
 * - No database access beyond auth
 * - Fail closed on any error
 *
 * This service wraps Supabase Auth client for JWT verification.
 * Backend trusts auth.uid() only after verification.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseJwtPayload } from '../guards/auth.guard';

/**
 * Configuration for Supabase Auth.
 */
export interface SupabaseAuthConfig {
  url: string;
  serviceRoleKey: string;
  jwtSecret?: string;
}

/**
 * Service for Supabase authentication operations.
 *
 * This is the ONLY place where Supabase Auth is called.
 * All token verification flows through this service.
 */
@Injectable()
export class SupabaseAuthService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseAuthService.name);
  private supabase: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Supabase client on module init.
   */
  onModuleInit(): void {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.warn('Supabase configuration missing. Auth will fail until configured.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    this.logger.log('Supabase Auth client initialized');
  }

  /**
   * Verify a JWT token and extract the payload.
   *
   * @param token - JWT token string
   * @returns Payload if valid, null if invalid
   *
   * Fail-closed: Returns null on any error.
   */
  async verifyToken(token: string): Promise<SupabaseJwtPayload | null> {
    if (!token || token.trim().length === 0) {
      this.logger.debug('Empty token provided');
      return null;
    }

    if (!this.supabase) {
      this.logger.error('Supabase client not initialized');
      return null;
    }

    try {
      // Use Supabase's built-in token verification
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error) {
        this.logger.debug('Token verification failed', { error: error.message });
        return null;
      }

      if (!user) {
        this.logger.debug('No user returned from token verification');
        return null;
      }

      // Construct payload from verified user
      const payload: SupabaseJwtPayload = {
        sub: user.id,
        email: user.email,
        exp: 0, // Will be set from token if needed
        iat: 0, // Will be set from token if needed
        aud: 'authenticated',
        role: user.role,
      };

      // Try to extract exp/iat from token for additional validation
      const tokenPayload = this.decodeTokenPayload(token);
      if (tokenPayload) {
        payload.exp = tokenPayload.exp ?? 0;
        payload.iat = tokenPayload.iat ?? 0;
      }

      return payload;
    } catch (error) {
      this.logger.error('Token verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Decode JWT payload without verification.
   * Used only for extracting exp/iat after Supabase verification.
   *
   * @param token - JWT token
   * @returns Decoded payload or null
   */
  private decodeTokenPayload(token: string): Partial<SupabaseJwtPayload> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payloadBase64 = parts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      return JSON.parse(payloadJson) as Partial<SupabaseJwtPayload>;
    } catch {
      return null;
    }
  }

  /**
   * Check if the service is properly configured.
   *
   * @returns true if Supabase client is initialized
   */
  isConfigured(): boolean {
    return this.supabase !== null;
  }
}
