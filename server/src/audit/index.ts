/**
 * Audit Module Barrel Export
 *
 * Provides immutable, append-only audit logging capabilities.
 */

// Module
export { AuditModule } from './audit.module';

// Service
export { AuditService } from './audit.service';

// Repository
export { AuditRepository } from './audit.repository';

// Types
export {
  // Enums
  AuditEventCategory,
  AdaptationAuditEventType,
  HarmAuditEventType,
  GoalAuditEventType,
  // Interfaces
  AuditRecord,
  AuditPayload,
  CreateAuditRecordInput,
  CreateAdaptationAuditInput,
  CreateHarmAuditInput,
  CreateGoalAuditInput,
  QueryAuditRecordsOptions,
  AuditRecordsResult,
} from './types';
