import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { validateEnv } from './common/config/env.validation';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { HealthModule } from './common/health';
import { AuthModule } from './common/auth';

// Domain Modules
import { DatabaseModule } from './common/database/database.module';
import { AIModule } from './ai/ai.module';
import { BehaviorModule } from './behavior/behavior.module';
import { GoalsModule } from './goals/goals.module';
import { TasksModule } from './tasks/tasks.module';
import { AdaptationsModule } from './adaptations/adaptations.module';
import { AuditModule } from './audit/audit.module';
import { HarmModule } from './harm/harm.module';
import { NotificationsModule } from './notifications/notifications.module';

/**
 * Root application module.
 * Configures global providers and imports all domain modules.
 *
 * Module loading order matters for dependencies:
 * 1. DatabaseModule (global - provides PrismaService)
 * 2. AuthModule (global - provides Supabase auth + AuthGuard)
 * 3. AIModule (provides AIGatewayService)
 * 4. BehaviorModule (deterministic behavioral engine)
 * 5. AuditModule (logging, no dependencies)
 * 6. HarmModule (depends on TasksModule, AuditModule)
 * 7. NotificationsModule (in-app notifications)
 * 8. TasksModule (depends on BehaviorModule)
 * 9. GoalsModule (depends on TasksModule, AIModule)
 * 10. AdaptationsModule (depends on GoalsModule, TasksModule)
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Infrastructure
    DatabaseModule,
    AuthModule, // Global auth with AuthGuard
    HealthModule,

    // AI (isolated - no DB access)
    AIModule,

    // Behavioral Engine (deterministic - no AI)
    BehaviorModule,

    // Audit & Safety
    AuditModule,
    HarmModule,
    NotificationsModule,

    // Domain Modules
    TasksModule,
    GoalsModule,
    AdaptationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
