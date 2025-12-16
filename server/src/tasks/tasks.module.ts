/**
 * Tasks Module
 *
 * @see BACKEND SPECIFICATION Section 3 - Core Domain Modules
 * @see LLM INPUT CONTRACT Section 4 - Domain Modules
 *
 * This module provides task management functionality.
 *
 * Features:
 * - Task completion (idempotent)
 * - Task skip
 * - Behavior evaluation triggers via BehavioralEngineService
 */

import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskRepository } from './task.repository';
import { DatabaseModule } from '../common/database/database.module';
import { BehaviorModule } from '../behavior/behavior.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule.forRoot(),
    BehaviorModule,
    forwardRef(() => GoalsModule),
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository],
  exports: [TaskService, TaskRepository],
})
export class TasksModule {}
