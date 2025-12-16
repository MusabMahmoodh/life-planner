/**
 * Harm Module
 *
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling (Product Safety)
 *
 * Provides harm detection and response capabilities:
 * - Detect stress or harm signals
 * - Force plan simplification
 * - Disable auto-adaptation temporarily
 * - Log incidents
 *
 * Harm Signals (from spec):
 * - User marks ≥5 tasks "unrealistic"
 * - Consistency drops ≥30% post-adaptation
 * - User messages "overwhelmed / quitting"
 *
 * Backend Response (from spec):
 * - Force difficulty reduction
 * - Disable auto-adaptation
 * - Log incident
 * - Require user confirmation to proceed
 */

import { Module, forwardRef } from '@nestjs/common';
import { HarmDetectionService } from './harm-detection.service';
import { HarmRepository } from './harm.repository';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [forwardRef(() => TasksModule), AuditModule],
  providers: [HarmDetectionService, HarmRepository],
  exports: [HarmDetectionService],
})
export class HarmModule {}
