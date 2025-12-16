import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';

/**
 * Audit Module
 *
 * Provides immutable, append-only audit logging for the application.
 * Tracks adaptation lifecycle events and harm incidents.
 *
 * Design Principles:
 * - Append-only: Records cannot be modified or deleted
 * - No business logic: Pure logging responsibility
 * - Immutable records: All audit entries are permanent
 *
 * Event Categories:
 * - ADAPTATION: Tracks adaptation lifecycle (created, accepted, rejected, rolled back)
 * - HARM: Tracks harm detection incidents
 * - GOAL: Tracks goal lifecycle events
 */
@Module({
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}
