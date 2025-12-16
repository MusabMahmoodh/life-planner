/**
 * Audit Service
 *
 * @see BACKEND SPECIFICATION Section 8 - All adaptations must be auditable
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling (log incident)
 *
 * Responsibilities:
 * - Log adaptation lifecycle events
 * - Log harm incidents
 * - Store immutable audit records
 *
 * Rules:
 * - APPEND-ONLY: No modifications or deletions
 * - No business logic: Just logging
 * - Fail-safe: Audit failures should not break main operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import {
  AuditRecord,
  AuditEventCategory,
  AdaptationAuditEventType,
  HarmAuditEventType,
  GoalAuditEventType,
  CreateAdaptationAuditInput,
  CreateHarmAuditInput,
  CreateGoalAuditInput,
  QueryAuditRecordsOptions,
  AuditRecordsResult,
} from './types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  // ============================================
  // Adaptation Audit Events
  // ============================================

  /**
   * Log an adaptation lifecycle event.
   *
   * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
   *
   * Events:
   * - ADAPTATION_TRIGGERED: Behavioral engine triggered
   * - ADAPTATION_PROPOSED: AI proposed change
   * - ADAPTATION_STORED: Stored as suggested
   * - ADAPTATION_ACCEPTED: User accepted
   * - ADAPTATION_REJECTED: User rejected
   * - ADAPTATION_ROLLED_BACK: User rolled back
   *
   * @param input - Adaptation audit input
   * @returns Created audit record or null on failure
   */
  async logAdaptationEvent(input: CreateAdaptationAuditInput): Promise<AuditRecord | null> {
    try {
      return await this.auditRepository.create({
        category: AuditEventCategory.ADAPTATION,
        eventType: input.eventType,
        userId: input.userId,
        entityId: input.adaptationId ?? input.goalId,
        entityType: input.adaptationId ? 'adaptation' : 'goal',
        payload: {
          ...input.payload,
          goalId: input.goalId,
          adaptationId: input.adaptationId,
        },
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      });
    } catch (error) {
      // Fail-safe: Log error but don't throw
      this.logger.error('Failed to create adaptation audit record', {
        error,
        input,
      });
      return null;
    }
  }

  /**
   * Log adaptation triggered by behavioral engine.
   */
  async logAdaptationTriggered(
    userId: string,
    goalId: string,
    triggerReason: string,
    behavioralSignal: Record<string, unknown>,
  ): Promise<AuditRecord | null> {
    return this.logAdaptationEvent({
      eventType: AdaptationAuditEventType.ADAPTATION_TRIGGERED,
      userId,
      goalId,
      payload: {
        description: `Adaptation triggered: ${triggerReason}`,
        metadata: {
          triggerReason,
          behavioralSignal,
        },
      },
    });
  }

  /**
   * Log adaptation stored as suggested.
   */
  async logAdaptationStored(
    userId: string,
    goalId: string,
    adaptationId: string,
    adaptationType: string,
    reason: string,
  ): Promise<AuditRecord | null> {
    return this.logAdaptationEvent({
      eventType: AdaptationAuditEventType.ADAPTATION_STORED,
      userId,
      goalId,
      adaptationId,
      payload: {
        description: `Adaptation stored as suggested: ${adaptationType}`,
        metadata: {
          adaptationType,
          reason,
        },
      },
    });
  }

  /**
   * Log adaptation accepted by user.
   */
  async logAdaptationAccepted(
    userId: string,
    goalId: string,
    adaptationId: string,
    appliedChanges: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditRecord | null> {
    return this.logAdaptationEvent({
      eventType: AdaptationAuditEventType.ADAPTATION_ACCEPTED,
      userId,
      goalId,
      adaptationId,
      payload: {
        description: 'User accepted adaptation',
        newState: appliedChanges,
        metadata: {
          action: 'accept',
        },
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log adaptation rejected by user.
   */
  async logAdaptationRejected(
    userId: string,
    goalId: string,
    adaptationId: string,
    blockedUntil: Date | null,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditRecord | null> {
    return this.logAdaptationEvent({
      eventType: AdaptationAuditEventType.ADAPTATION_REJECTED,
      userId,
      goalId,
      adaptationId,
      payload: {
        description: 'User rejected adaptation',
        metadata: {
          action: 'reject',
          blockedUntil: blockedUntil?.toISOString(),
        },
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log adaptation rolled back by user.
   */
  async logAdaptationRolledBack(
    userId: string,
    goalId: string,
    adaptationId: string,
    restoredState: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditRecord | null> {
    return this.logAdaptationEvent({
      eventType: AdaptationAuditEventType.ADAPTATION_ROLLED_BACK,
      userId,
      goalId,
      adaptationId,
      payload: {
        description: 'User rolled back adaptation',
        previousState: restoredState,
        metadata: {
          action: 'rollback',
        },
      },
      ipAddress,
      userAgent,
    });
  }

  // ============================================
  // Harm Audit Events
  // ============================================

  /**
   * Log a harm incident.
   *
   * @see BACKEND SPECIFICATION Section 11 - Failure Handling
   *
   * Harm signals:
   * - User marks ≥5 tasks "unrealistic"
   * - Consistency drops ≥30% post-adaptation
   * - User messages "overwhelmed / quitting"
   *
   * @param input - Harm audit input
   * @returns Created audit record or null on failure
   */
  async logHarmIncident(input: CreateHarmAuditInput): Promise<AuditRecord | null> {
    try {
      const record = await this.auditRepository.create({
        category: AuditEventCategory.HARM,
        eventType: input.eventType,
        userId: input.userId,
        entityId: input.goalId ?? null,
        entityType: input.goalId ? 'goal' : null,
        payload: input.payload,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      });

      // Harm incidents are critical - always log to console
      this.logger.warn('Harm incident logged', {
        recordId: record.id,
        eventType: input.eventType,
        userId: input.userId,
        goalId: input.goalId,
      });

      return record;
    } catch (error) {
      this.logger.error('Failed to create harm audit record', {
        error,
        input,
      });
      return null;
    }
  }

  /**
   * Log unrealistic tasks flagged by user.
   */
  async logUnrealisticTasksFlagged(
    userId: string,
    goalId: string,
    taskCount: number,
    taskIds: string[],
  ): Promise<AuditRecord | null> {
    return this.logHarmIncident({
      eventType: HarmAuditEventType.UNREALISTIC_TASKS_FLAGGED,
      userId,
      goalId,
      payload: {
        description: `User flagged ${taskCount} tasks as unrealistic`,
        metadata: {
          taskCount,
          taskIds,
          threshold: 5,
          exceededThreshold: taskCount >= 5,
        },
      },
    });
  }

  /**
   * Log consistency drop detected.
   */
  async logConsistencyDrop(
    userId: string,
    goalId: string,
    previousRate: number,
    currentRate: number,
    dropPercentage: number,
  ): Promise<AuditRecord | null> {
    return this.logHarmIncident({
      eventType: HarmAuditEventType.CONSISTENCY_DROP_DETECTED,
      userId,
      goalId,
      payload: {
        description: `Consistency dropped ${dropPercentage}% from ${previousRate}% to ${currentRate}%`,
        previousState: { completionRate: previousRate },
        newState: { completionRate: currentRate },
        metadata: {
          dropPercentage,
          threshold: 30,
          exceededThreshold: dropPercentage >= 30,
        },
      },
    });
  }

  /**
   * Log difficulty reduction forced by system.
   */
  async logDifficultyReductionForced(
    userId: string,
    goalId: string,
    reason: string,
    previousDifficulty: string,
    newDifficulty: string,
  ): Promise<AuditRecord | null> {
    return this.logHarmIncident({
      eventType: HarmAuditEventType.DIFFICULTY_REDUCTION_FORCED,
      userId,
      goalId,
      payload: {
        description: `System forced difficulty reduction: ${reason}`,
        previousState: { difficulty: previousDifficulty },
        newState: { difficulty: newDifficulty },
        metadata: {
          reason,
          automatic: true,
        },
      },
    });
  }

  /**
   * Log auto-adaptation disabled due to harm.
   */
  async logAutoAdaptationDisabled(
    userId: string,
    goalId: string,
    reason: string,
  ): Promise<AuditRecord | null> {
    return this.logHarmIncident({
      eventType: HarmAuditEventType.AUTO_ADAPTATION_DISABLED,
      userId,
      goalId,
      payload: {
        description: `Auto-adaptation disabled: ${reason}`,
        metadata: {
          reason,
        },
      },
    });
  }

  // ============================================
  // Goal Audit Events
  // ============================================

  /**
   * Log a goal lifecycle event.
   */
  async logGoalEvent(input: CreateGoalAuditInput): Promise<AuditRecord | null> {
    try {
      return await this.auditRepository.create({
        category: AuditEventCategory.GOAL,
        eventType: input.eventType,
        userId: input.userId,
        entityId: input.goalId,
        entityType: 'goal',
        payload: input.payload,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      });
    } catch (error) {
      this.logger.error('Failed to create goal audit record', {
        error,
        input,
      });
      return null;
    }
  }

  /**
   * Log goal created.
   */
  async logGoalCreated(
    userId: string,
    goalId: string,
    title: string,
    taskCount: number,
  ): Promise<AuditRecord | null> {
    return this.logGoalEvent({
      eventType: GoalAuditEventType.GOAL_CREATED,
      userId,
      goalId,
      payload: {
        description: `Goal created: ${title}`,
        metadata: {
          title,
          taskCount,
        },
      },
    });
  }

  /**
   * Log goal status changed.
   */
  async logGoalStatusChanged(
    userId: string,
    goalId: string,
    previousStatus: string,
    newStatus: string,
  ): Promise<AuditRecord | null> {
    return this.logGoalEvent({
      eventType: GoalAuditEventType.GOAL_STATUS_CHANGED,
      userId,
      goalId,
      payload: {
        description: `Goal status changed from ${previousStatus} to ${newStatus}`,
        previousState: { status: previousStatus },
        newState: { status: newStatus },
      },
    });
  }

  /**
   * Log goal plan version incremented.
   */
  async logGoalPlanVersionIncremented(
    userId: string,
    goalId: string,
    previousVersion: number,
    newVersion: number,
    adaptationId: string,
  ): Promise<AuditRecord | null> {
    return this.logGoalEvent({
      eventType: GoalAuditEventType.GOAL_PLAN_VERSION_INCREMENTED,
      userId,
      goalId,
      payload: {
        description: `Plan version incremented from ${previousVersion} to ${newVersion}`,
        previousState: { planVersion: previousVersion },
        newState: { planVersion: newVersion },
        metadata: {
          adaptationId,
        },
      },
    });
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Query audit records.
   */
  async queryAuditRecords(options: QueryAuditRecordsOptions): Promise<AuditRecordsResult> {
    return this.auditRepository.query(options);
  }

  /**
   * Get audit trail for an entity.
   */
  async getEntityAuditTrail(
    entityId: string,
    entityType: 'goal' | 'task' | 'adaptation' | 'user',
  ): Promise<AuditRecord[]> {
    return this.auditRepository.findByEntity(entityId, entityType);
  }

  /**
   * Get recent audit records for a user.
   */
  async getUserAuditTrail(userId: string, limit: number = 50): Promise<AuditRecord[]> {
    return this.auditRepository.findRecentByUser(userId, limit);
  }

  /**
   * Get adaptation audit trail.
   */
  async getAdaptationAuditTrail(adaptationId: string): Promise<AuditRecord[]> {
    return this.auditRepository.findByEntity(adaptationId, 'adaptation');
  }

  /**
   * Get goal audit trail.
   */
  async getGoalAuditTrail(goalId: string): Promise<AuditRecord[]> {
    return this.auditRepository.findByEntity(goalId, 'goal');
  }
}
