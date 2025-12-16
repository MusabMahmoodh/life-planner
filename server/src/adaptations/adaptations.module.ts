import { Module, forwardRef } from '@nestjs/common';
import { AdaptationController } from './adaptation.controller';
import { AdaptationRulesService } from './adaptation-rules.service';
import { AdaptationRepository } from './adaptation.repository';
import { AdaptationService } from './adaptation.service';
import { GoalsModule } from '../goals/goals.module';
import { TasksModule } from '../tasks/tasks.module';

/**
 * AdaptationsModule provides adaptation management capabilities.
 *
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 *
 * This module exports:
 * - AdaptationController for REST endpoints
 * - AdaptationService for adaptation lifecycle management
 * - AdaptationRulesService for converting signals to intents
 * - AdaptationRepository for database operations
 */
@Module({
  imports: [forwardRef(() => GoalsModule), forwardRef(() => TasksModule)],
  controllers: [AdaptationController],
  providers: [AdaptationService, AdaptationRulesService, AdaptationRepository],
  exports: [AdaptationService, AdaptationRulesService, AdaptationRepository],
})
export class AdaptationsModule {}
