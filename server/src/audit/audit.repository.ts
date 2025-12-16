/**
 * Audit Repository
 *
 * @see BACKEND SPECIFICATION Section 8 - All adaptations must be auditable
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling (log incident)
 *
 * Handles database operations for audit records.
 * APPEND-ONLY: No updates or deletes allowed.
 *
 * Note: This repository uses raw SQL via Prisma since the AuditLog
 * table may not be defined in the Prisma schema (for true append-only behavior).
 * Alternatively, it can store to a separate audit database or use JSONB.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AuditRecord,
  CreateAuditRecordInput,
  QueryAuditRecordsOptions,
  AuditRecordsResult,
} from './types';
import { randomUUID } from 'crypto';

/**
 * In-memory audit store for V1.
 * In production, this should be replaced with:
 * - A dedicated audit table with no UPDATE/DELETE permissions
 * - An external audit logging service (e.g., AWS CloudTrail, Datadog)
 * - A time-series database for audit logs
 *
 * The in-memory implementation maintains the same interface
 * for easy migration to persistent storage.
 */
@Injectable()
export class AuditRepository {
  private readonly logger = new Logger(AuditRepository.name);

  /**
   * In-memory audit log store.
   * Thread-safe for single-instance Node.js applications.
   *
   * IMPORTANT: In production, replace with persistent storage.
   */
  private readonly auditLog: AuditRecord[] = [];

  // Constructor kept minimal - no dependencies needed for in-memory store
  // In production, inject database client here

  /**
   * Create an audit record.
   * APPEND-ONLY: Records cannot be modified or deleted.
   *
   * @param input - Audit record input
   * @returns Created audit record
   */
  async create(input: CreateAuditRecordInput): Promise<AuditRecord> {
    const record: AuditRecord = {
      id: randomUUID(),
      category: input.category,
      eventType: input.eventType,
      userId: input.userId,
      entityId: input.entityId,
      entityType: input.entityType,
      payload: input.payload,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: new Date(),
    };

    // Append to in-memory store
    this.auditLog.push(record);

    this.logger.debug('Audit record created', {
      id: record.id,
      category: record.category,
      eventType: record.eventType,
      entityId: record.entityId,
    });

    return await Promise.resolve(record);
  }

  /**
   * Query audit records with filtering and pagination.
   * Read-only operation.
   *
   * @param options - Query options
   * @returns Paginated audit records
   */
  async query(options: QueryAuditRecordsOptions): Promise<AuditRecordsResult> {
    let filtered = [...this.auditLog];

    // Apply filters
    if (options.userId) {
      filtered = filtered.filter((r) => r.userId === options.userId);
    }

    if (options.category != null) {
      filtered = filtered.filter((r) => r.category === options.category);
    }

    if (options.eventType != null) {
      filtered = filtered.filter((r) => r.eventType === options.eventType);
    }

    if (options.entityId) {
      filtered = filtered.filter((r) => r.entityId === options.entityId);
    }

    if (options.fromDate) {
      filtered = filtered.filter((r) => r.createdAt >= options.fromDate!);
    }

    if (options.toDate) {
      filtered = filtered.filter((r) => r.createdAt <= options.toDate!);
    }

    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 50;
    const paginated = filtered.slice(offset, offset + limit);

    return await Promise.resolve({
      records: paginated,
      total,
      hasMore: offset + paginated.length < total,
    });
  }

  /**
   * Find an audit record by ID.
   * Read-only operation.
   *
   * @param id - Audit record ID
   * @returns Audit record or null
   */
  async findById(id: string): Promise<AuditRecord | null> {
    return await Promise.resolve(this.auditLog.find((r) => r.id === id) ?? null);
  }

  /**
   * Get audit records for a specific entity.
   * Read-only operation.
   *
   * @param entityId - Entity ID
   * @param entityType - Entity type
   * @returns Audit records for the entity
   */
  async findByEntity(
    entityId: string,
    entityType: 'goal' | 'task' | 'adaptation' | 'user',
  ): Promise<AuditRecord[]> {
    return await Promise.resolve(
      this.auditLog
        .filter((r) => r.entityId === entityId && r.entityType === entityType)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  /**
   * Get the count of audit records matching criteria.
   * Read-only operation.
   *
   * @param options - Query options (without pagination)
   * @returns Count of matching records
   */
  async count(options: Omit<QueryAuditRecordsOptions, 'limit' | 'offset'>): Promise<number> {
    const result = await this.query({ ...options, limit: Number.MAX_SAFE_INTEGER });
    return result.total;
  }

  /**
   * Get recent audit records for a user.
   * Read-only operation.
   *
   * @param userId - User ID
   * @param limit - Maximum records to return
   * @returns Recent audit records
   */
  async findRecentByUser(userId: string, limit: number = 50): Promise<AuditRecord[]> {
    const result = await this.query({ userId, limit });
    return result.records;
  }
}
