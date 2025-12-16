/**
 * Development Auth Middleware
 *
 * This middleware injects a mock user for LOCAL DEVELOPMENT ONLY.
 * DO NOT use in production!
 *
 * Usage:
 * 1. Set DEV_AUTH_BYPASS=true in .env.local
 * 2. Optionally set DEV_USER_ID to use a specific user ID
 *
 * This allows testing without a real Supabase JWT token.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DevAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DevAuthMiddleware.name);

  constructor(private readonly configService: ConfigService) {
    this.logger.log(`DevAuthMiddleware initialized`);
    this.logger.log(`DEV_AUTH_BYPASS = ${this.configService.get<string>('DEV_AUTH_BYPASS')}`);
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    const devAuthBypass = this.configService.get<string>('DEV_AUTH_BYPASS');

    this.logger.debug(
      `Middleware called for ${req.method} ${req.path}, DEV_AUTH_BYPASS=${devAuthBypass}`,
    );

    if (devAuthBypass === 'true') {
      // Use provided DEV_USER_ID or generate a consistent test user ID
      const devUserId =
        this.configService.get<string>('DEV_USER_ID') || '00000000-0000-0000-0000-000000000001';

      // Inject mock user into request
      req.user = {
        id: devUserId,
        email: 'dev@test.local',
      };

      this.logger.log(`Dev auth bypass: injected user ${devUserId} for ${req.method} ${req.path}`);
    }

    next();
  }
}
