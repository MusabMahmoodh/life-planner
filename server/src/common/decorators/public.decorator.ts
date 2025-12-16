/**
 * Public Decorator
 *
 * Marks routes as public (no authentication required).
 * Used in conjunction with AuthGuard.
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route or controller as public.
 * Public routes bypass authentication.
 *
 * Usage:
 * ```ts
 * @Public()
 * @Get('health')
 * healthCheck() { return 'OK'; }
 * ```
 */
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC_KEY, true);
