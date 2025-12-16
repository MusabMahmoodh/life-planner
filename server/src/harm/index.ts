/**
 * Harm Module Barrel Export
 *
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling (Product Safety)
 *
 * Provides harm detection and response capabilities.
 */

// Module
export { HarmModule } from './harm.module';

// Service
export { HarmDetectionService } from './harm-detection.service';

// Repository
export { HarmRepository } from './harm.repository';

// Types
export {
  // Enums
  HarmSignalType,
  HarmSeverity,
  HarmIncidentStatus,
  // Interfaces
  HarmSignal,
  HarmSignalMetadata,
  HarmResponseActions,
  HarmIncident,
  UnrealisticTasksInput,
  ConsistencyDropInput,
  UserDistressInput,
  HarmDetectionResult,
  RequiredHarmActions,
  UserHarmState,
  CreateHarmIncidentInput,
  ResolveHarmIncidentInput,
  ForceDifficultyReductionInput,
  ForceDifficultyReductionResult,
  // Constants
  UNREALISTIC_TASKS_THRESHOLD,
  CONSISTENCY_DROP_THRESHOLD_PERCENT,
  DISTRESS_KEYWORDS,
} from './types';
