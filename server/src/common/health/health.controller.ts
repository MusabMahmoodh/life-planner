/**
 * Health Controller
 *
 * Provides basic health check endpoint for monitoring and testing.
 * This endpoint is public (no authentication required).
 */

import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

@Controller('health')
export class HealthController {
  /**
   * Basic health check endpoint.
   *
   * @route GET /health
   * @returns Health status with timestamp and uptime
   */
  @Public()
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
