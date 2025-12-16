/**
 * Goals Module
 *
 * @see BACKEND SPECIFICATION Section 3 - Core Domain Modules
 * @see LLM INPUT CONTRACT Section 4 - Domain Modules
 *
 * This module provides goal management functionality.
 *
 * Dependencies:
 * - DatabaseModule: For PrismaService
 * - TasksModule: For TaskRepository (tasks belong to goals)
 * - AIModule: For AIGatewayService (goal generation)
 */

import { Module, forwardRef } from '@nestjs/common';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { GoalRepository } from './goal.repository';
import { DatabaseModule } from '../common/database/database.module';
import { TasksModule } from '../tasks/tasks.module';
import { AIModule } from '../ai/ai.module';

/**
 * Goals module configuration.
 *
 * Note: AIGatewayService is injected via token AI_GATEWAY_SERVICE.
 * The actual implementation is provided by AIModule.
 */
@Module({
  imports: [DatabaseModule, forwardRef(() => TasksModule), AIModule],
  controllers: [GoalController],
  providers: [GoalService, GoalRepository],
  exports: [GoalService, GoalRepository],
})
export class GoalsModule {}
