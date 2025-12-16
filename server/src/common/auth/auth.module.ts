import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthService } from './supabase-auth.service';
import { AuthGuard } from '../guards/auth.guard';

/**
 * Auth Module
 *
 * Provides Supabase authentication globally.
 * Registers AuthGuard as a global guard - all routes require auth by default.
 * Use @Public() decorator to exempt routes.
 */
@Global()
@Module({
  providers: [
    SupabaseAuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [SupabaseAuthService],
})
export class AuthModule {}
