/**
 * User Decorator
 *
 * @see BACKEND SPECIFICATION Section 4 - Authentication & Security
 * @see BACKEND SPECIFICATION Section 10 - Security Rules
 *
 * Extracts authenticated user from request.
 * Placeholder until full AuthModule is implemented.
 */

import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Authenticated user context.
 * This will be populated by the AuthGuard.
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Extend Express Request to include user.
 * Using module augmentation pattern.
 */
declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

/**
 * Parameter decorator to extract authenticated user ID.
 *
 * Usage:
 * ```ts
 * @Get()
 * getGoals(@UserId() userId: string) { ... }
 * ```
 *
 * @throws UnauthorizedException if user is not authenticated
 */
export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = request.user;

  if (!user || !user.id) {
    throw new UnauthorizedException('User not authenticated');
  }

  return user.id;
});

/**
 * Parameter decorator to extract full authenticated user.
 *
 * Usage:
 * ```ts
 * @Get()
 * getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
 * ```
 *
 * @throws UnauthorizedException if user is not authenticated
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user;
  },
);
