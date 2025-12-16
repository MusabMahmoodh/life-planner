/**
 * Rate Limit Guard
 *
 * Protects AI-triggering endpoints from abuse and excessive OpenAI API costs.
 * Uses simple in-memory sliding window rate limiting per user.
 *
 * V1: In-memory only (no Redis). Suitable for single-instance deployments.
 * For multi-instance, migrate to Redis-based solution.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// ============================================================================
// METADATA KEYS
// ============================================================================

/**
 * Metadata key for rate limit configuration
 */
export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Metadata key to skip rate limiting on specific routes
 */
export const SKIP_RATE_LIMIT_KEY = 'skip_rate_limit';

// ============================================================================
// DECORATORS
// ============================================================================

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

/**
 * Default rate limit for AI endpoints
 * 5 requests per 60 seconds per user
 */
export const DEFAULT_AI_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 60,
};

/**
 * Decorator to apply rate limiting to a route or controller
 *
 * @example
 * ```typescript
 * @RateLimit({ maxRequests: 5, windowSeconds: 60 })
 * @Post('generate')
 * async generateGoal() { ... }
 * ```
 */
export const RateLimit = (config: RateLimitConfig): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Decorator to skip rate limiting for a specific route
 * Useful when a controller has @RateLimit but specific routes should be exempt
 *
 * @example
 * ```typescript
 * @SkipRateLimit()
 * @Get('status')
 * async getStatus() { ... }
 * ```
 */
export const SkipRateLimit = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_RATE_LIMIT_KEY, true);

// ============================================================================
// RATE LIMIT GUARD
// ============================================================================

/**
 * Timestamp entry for rate limiting
 */
interface RateLimitEntry {
  timestamps: number[];
}

/**
 * Rate Limit Guard
 *
 * Implements sliding window rate limiting per user.
 * Only applies to routes decorated with @RateLimit().
 *
 * Features:
 * - Per-user rate limiting (requires authenticated request)
 * - Configurable limits per route/controller
 * - Sliding window algorithm
 * - Automatic cleanup of expired entries
 * - Returns 429 Too Many Requests when limit exceeded
 *
 * @example
 * ```typescript
 * // In controller
 * @RateLimit({ maxRequests: 5, windowSeconds: 60 })
 * @Post('generate')
 * async generateGoal(@CurrentUser() user: User) { ... }
 * ```
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  /**
   * In-memory store for rate limit tracking
   * Map<userId, RateLimitEntry>
   *
   * Note: This is cleared on server restart.
   * For production multi-instance, migrate to Redis.
   */
  private readonly userRequests = new Map<string, RateLimitEntry>();

  /**
   * Cleanup interval in milliseconds (5 minutes)
   * Periodically removes expired entries to prevent memory leaks
   */
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

  /**
   * Maximum window to track (used for cleanup)
   */
  private readonly MAX_WINDOW_SECONDS = 300; // 5 minutes max

  constructor(private readonly reflector: Reflector) {
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Main guard method - checks if request should be allowed
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limiting should be skipped
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipRateLimit === true) {
      return true;
    }

    // Get rate limit config from decorator
    const rateLimitConfig = this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @RateLimit decorator = no rate limiting
    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userId = this.extractUserId(request);

    // No userId = no rate limiting (unauthenticated requests handled by AuthGuard)
    if (!userId) {
      this.logger.warn('Rate limit check skipped: No userId in request');
      return true;
    }

    const { maxRequests, windowSeconds } = rateLimitConfig;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Get or create entry for user
    let entry = this.userRequests.get(userId);
    if (!entry) {
      entry = { timestamps: [] };
      this.userRequests.set(userId, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    if (entry.timestamps.length >= maxRequests) {
      const oldestTimestamp = Math.min(...entry.timestamps);
      const retryAfterMs = oldestTimestamp + windowMs - now;
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      this.logger.warn(
        `Rate limit exceeded for user ${userId}: ${entry.timestamps.length}/${maxRequests} requests in ${windowSeconds}s window`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds} seconds. Please try again in ${retryAfterSeconds} seconds.`,
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp
    entry.timestamps.push(now);

    this.logger.debug(
      `Rate limit check passed for user ${userId}: ${entry.timestamps.length}/${maxRequests} requests`,
    );

    return true;
  }

  /**
   * Extract userId from authenticated request
   * Relies on AuthGuard having already set the user
   */
  private extractUserId(request: Request): string | null {
    // User should be set by AuthGuard
    const user = (request as Request & { user?: { sub?: string; userId?: string } }).user;

    if (!user) {
      return null;
    }

    // Support both 'sub' (JWT standard) and 'userId' formats
    return user.sub ?? user.userId ?? null;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Remove entries with no recent timestamps
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const maxWindowMs = this.MAX_WINDOW_SECONDS * 1000;
    let cleanedCount = 0;

    for (const [userId, entry] of this.userRequests.entries()) {
      // Remove timestamps older than max window
      entry.timestamps = entry.timestamps.filter((ts) => ts > now - maxWindowMs);

      // Remove entry if no timestamps remain
      if (entry.timestamps.length === 0) {
        this.userRequests.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  /**
   * Get current rate limit status for a user (useful for debugging/monitoring)
   */
  getRateLimitStatus(
    userId: string,
    config: RateLimitConfig,
  ): {
    currentRequests: number;
    maxRequests: number;
    windowSeconds: number;
    remainingRequests: number;
  } {
    const entry = this.userRequests.get(userId);
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    const currentRequests = entry ? entry.timestamps.filter((ts) => ts > windowStart).length : 0;

    return {
      currentRequests,
      maxRequests: config.maxRequests,
      windowSeconds: config.windowSeconds,
      remainingRequests: Math.max(0, config.maxRequests - currentRequests),
    };
  }

  /**
   * Manually reset rate limit for a user (useful for testing or admin actions)
   */
  resetUserRateLimit(userId: string): void {
    this.userRequests.delete(userId);
    this.logger.debug(`Rate limit reset for user ${userId}`);
  }

  /**
   * Clear all rate limit entries (useful for testing)
   */
  clearAllRateLimits(): void {
    this.userRequests.clear();
    this.logger.debug('All rate limits cleared');
  }
}
