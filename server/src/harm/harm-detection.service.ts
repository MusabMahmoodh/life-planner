/**
 * HarmDetectionService
 *
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling (Product Safety)
 *
 * Responsibilities:
 * - Detect stress or harm signals
 * - Force plan simplification
 * - Disable auto-adaptation temporarily
 * - Log incident
 *
 * Rules:
 * - DETERMINISTIC triggers (no AI calls)
 * - All decisions are rule-based
 * - Fail-safe: When in doubt, protect the user
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

import { Injectable, Logger } from '@nestjs/common';
import { DifficultyLevel } from '@prisma/client';
import { HarmRepository } from './harm.repository';
import { TaskRepository } from '../tasks/task.repository';
import { AuditService } from '../audit/audit.service';
import { HarmAuditEventType } from '../audit/types';
import { DifficultyLevel as DifficultyLevelEnum, DIFFICULTY_ORDER } from '../common/enums';
import {
  HarmSignalType,
  HarmSeverity,
  HarmSignal,
  HarmIncident,
  HarmIncidentStatus,
  HarmDetectionResult,
  UserHarmState,
  UnrealisticTasksInput,
  ConsistencyDropInput,
  UserDistressInput,
  CreateHarmIncidentInput,
  ResolveHarmIncidentInput,
  ForceDifficultyReductionInput,
  ForceDifficultyReductionResult,
  UNREALISTIC_TASKS_THRESHOLD,
  CONSISTENCY_DROP_THRESHOLD_PERCENT,
  DISTRESS_KEYWORDS,
} from './types';

@Injectable()
export class HarmDetectionService {
  private readonly logger = new Logger(HarmDetectionService.name);

  constructor(
    private readonly harmRepository: HarmRepository,
    private readonly taskRepository: TaskRepository,
    private readonly auditService: AuditService,
  ) {}

  // ============================================
  // Harm Signal Detection (Deterministic)
  // ============================================

  /**
   * Detect harm signal from unrealistic task flags.
   *
   * @see BACKEND SPECIFICATION Section 11:
   * "User marks ≥5 tasks 'unrealistic'"
   *
   * @param input - Unrealistic tasks input
   * @returns HarmDetectionResult
   */
  detectUnrealisticTasks(input: UnrealisticTasksInput): HarmDetectionResult {
    const { unrealisticTaskCount, unrealisticTaskIds } = input;

    // Deterministic threshold check
    const harmDetected = unrealisticTaskCount >= UNREALISTIC_TASKS_THRESHOLD;

    if (!harmDetected) {
      return this.createNoHarmResult();
    }

    const signal: HarmSignal = {
      type: HarmSignalType.UNREALISTIC_TASKS,
      severity: this.calculateUnrealisticTasksSeverity(unrealisticTaskCount),
      message: `User marked ${unrealisticTaskCount} tasks as unrealistic (threshold: ${UNREALISTIC_TASKS_THRESHOLD})`,
      detectedAt: new Date(),
      metadata: {
        unrealisticTaskCount,
        unrealisticTaskIds,
        threshold: UNREALISTIC_TASKS_THRESHOLD,
      },
    };

    return this.createHarmResult([signal]);
  }

  /**
   * Detect harm signal from consistency drop post-adaptation.
   *
   * @see BACKEND SPECIFICATION Section 11:
   * "Consistency drops ≥30% post-adaptation"
   *
   * @param input - Consistency drop input
   * @returns HarmDetectionResult
   */
  detectConsistencyDrop(input: ConsistencyDropInput): HarmDetectionResult {
    const { adaptationId, previousConsistency, currentConsistency } = input;

    // Calculate percentage drop
    const dropPercent = previousConsistency - currentConsistency;

    // Deterministic threshold check
    const harmDetected = dropPercent >= CONSISTENCY_DROP_THRESHOLD_PERCENT;

    if (!harmDetected) {
      return this.createNoHarmResult();
    }

    const signal: HarmSignal = {
      type: HarmSignalType.CONSISTENCY_DROP,
      severity: this.calculateConsistencyDropSeverity(dropPercent),
      message: `Consistency dropped ${dropPercent.toFixed(1)}% after adaptation (threshold: ${CONSISTENCY_DROP_THRESHOLD_PERCENT}%)`,
      detectedAt: new Date(),
      metadata: {
        consistencyDropPercent: dropPercent,
        previousConsistency,
        currentConsistency,
        relatedAdaptationId: adaptationId,
        threshold: CONSISTENCY_DROP_THRESHOLD_PERCENT,
      },
    };

    return this.createHarmResult([signal]);
  }

  /**
   * Detect harm signal from user distress messages.
   *
   * @see BACKEND SPECIFICATION Section 11:
   * "User messages 'overwhelmed / quitting'"
   *
   * @param input - User distress input
   * @returns HarmDetectionResult
   */
  detectUserDistress(input: UserDistressInput): HarmDetectionResult {
    const { message, source } = input;

    // Normalize message for comparison
    const normalizedMessage = message.toLowerCase();

    // Find matching distress keywords (deterministic)
    const matchedKeywords = DISTRESS_KEYWORDS.filter((keyword) =>
      normalizedMessage.includes(keyword.toLowerCase()),
    );

    const harmDetected = matchedKeywords.length > 0;

    if (!harmDetected) {
      return this.createNoHarmResult();
    }

    const signal: HarmSignal = {
      type: HarmSignalType.USER_DISTRESS,
      severity: this.calculateDistressSeverity(matchedKeywords),
      message: `User expressed distress signals: ${matchedKeywords.join(', ')}`,
      detectedAt: new Date(),
      metadata: {
        distressKeywords: matchedKeywords,
        sourceMessage: message,
        source,
        keywordsMatched: matchedKeywords.length,
      },
    };

    return this.createHarmResult([signal]);
  }

  // ============================================
  // Harm Response Actions
  // ============================================

  /**
   * Process detected harm and take required actions.
   *
   * @see BACKEND SPECIFICATION Section 11:
   * - Force difficulty reduction
   * - Disable auto-adaptation
   * - Log incident
   * - Require user confirmation to proceed
   *
   * @param userId - User ID
   * @param goalId - Goal ID (if applicable)
   * @param result - Harm detection result
   * @returns Created harm incident
   */
  async processHarm(
    userId: string,
    goalId: string | undefined,
    result: HarmDetectionResult,
  ): Promise<HarmIncident | null> {
    if (!result.harmDetected || result.signals.length === 0) {
      return null;
    }

    // Use the most severe signal
    const primarySignal = this.getMostSevereSignal(result.signals);

    // Determine response actions based on severity
    const responseActions = this.determineResponseActions(primarySignal);

    // Create incident input
    const incidentInput: CreateHarmIncidentInput = {
      userId,
      goalId,
      signal: primarySignal,
      responseActions,
    };

    // Create the incident
    const incident = await this.harmRepository.createIncident(incidentInput);

    // Update user harm state
    if (responseActions.autoAdaptationDisabled) {
      await this.harmRepository.disableAutoAdaptation(userId, incident.id);
    }

    await this.harmRepository.addActiveIncident(userId, incident.id);

    // Log to audit service using the proper method signature
    await this.auditService.logHarmIncident({
      eventType: this.mapSignalTypeToAuditEvent(primarySignal.type),
      userId,
      goalId: goalId ?? undefined,
      payload: {
        description: primarySignal.message,
        metadata: {
          incidentId: incident.id,
          signalType: primarySignal.type,
          severity: primarySignal.severity,
          responseActions,
          signalMetadata: primarySignal.metadata,
        },
      },
    });

    this.logger.warn('Harm detected and processed', {
      userId,
      goalId,
      incidentId: incident.id,
      signalType: primarySignal.type,
      severity: primarySignal.severity,
      actionsAutoAdaptationDisabled: responseActions.autoAdaptationDisabled,
      actionsDifficultyReduced: responseActions.difficultyReduced,
    });

    return incident;
  }

  /**
   * Force difficulty reduction for all non-easy tasks.
   *
   * @see BACKEND SPECIFICATION Section 11:
   * "Force difficulty reduction"
   *
   * @param input - Force difficulty reduction input
   * @returns Result with reduced task IDs
   */
  async forceDifficultyReduction(
    input: ForceDifficultyReductionInput,
  ): Promise<ForceDifficultyReductionResult> {
    const { userId, goalId, targetDifficulty, incidentId } = input;

    try {
      // Get all tasks for the goal
      const tasks = await this.taskRepository.findAllByGoal(userId, goalId);

      // Filter tasks that are harder than target
      const tasksToReduce = tasks.filter(
        (task) =>
          this.getDifficultyIndex(task.difficulty) >
          this.getDifficultyIndex(targetDifficulty as DifficultyLevel),
      );

      if (tasksToReduce.length === 0) {
        return {
          success: true,
          tasksReduced: 0,
          reducedTaskIds: [],
        };
      }

      // Reduce difficulty for each task
      const reducedTaskIds: string[] = [];
      for (const task of tasksToReduce) {
        await this.taskRepository.update(userId, task.id, {
          difficulty: targetDifficulty as DifficultyLevel,
        });
        reducedTaskIds.push(task.id);
      }

      // Log to audit using correct method signature
      await this.auditService.logDifficultyReductionForced(
        userId,
        goalId,
        `Harm incident ${incidentId}: ${reducedTaskIds.length} tasks reduced to ${targetDifficulty}`,
        'various', // Previous difficulties were various
        targetDifficulty,
      );

      this.logger.log('Force difficulty reduction applied', {
        userId,
        goalId,
        incidentId,
        tasksReduced: reducedTaskIds.length,
        targetDifficulty,
      });

      return {
        success: true,
        tasksReduced: reducedTaskIds.length,
        reducedTaskIds,
      };
    } catch (error) {
      this.logger.error('Force difficulty reduction failed', { error, input });
      return {
        success: false,
        tasksReduced: 0,
        reducedTaskIds: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // User Harm State Management
  // ============================================

  /**
   * Get current harm state for a user.
   */
  async getUserHarmState(userId: string): Promise<UserHarmState> {
    return this.harmRepository.getUserHarmState(userId);
  }

  /**
   * Check if auto-adaptation is disabled for a user.
   */
  async isAutoAdaptationDisabled(userId: string): Promise<boolean> {
    return this.harmRepository.isAutoAdaptationDisabled(userId);
  }

  /**
   * Check if user confirmation is pending.
   */
  async isPendingUserConfirmation(userId: string): Promise<boolean> {
    return this.harmRepository.isPendingUserConfirmation(userId);
  }

  /**
   * Get active incidents for a user.
   */
  async getActiveIncidents(userId: string): Promise<HarmIncident[]> {
    return this.harmRepository.findActiveIncidentsForUser(userId);
  }

  /**
   * Get incidents for a specific goal.
   */
  async getIncidentsForGoal(userId: string, goalId: string): Promise<HarmIncident[]> {
    return this.harmRepository.findIncidentsForGoal(userId, goalId);
  }

  // ============================================
  // Incident Resolution
  // ============================================

  /**
   * Resolve a harm incident after user confirmation.
   *
   * @see BACKEND SPECIFICATION Section 11:
   * "Require user confirmation to proceed"
   *
   * @param input - Resolution input
   * @returns Resolved incident or null if not found
   */
  async resolveIncident(input: ResolveHarmIncidentInput): Promise<HarmIncident | null> {
    const { userId, incidentId, status, confirmationNotes } = input;

    // Verify ownership
    const incident = await this.harmRepository.findIncidentByIdForUser(userId, incidentId);
    if (!incident) {
      return null;
    }

    // Update incident status
    const resolved = await this.harmRepository.updateIncidentStatus(
      incidentId,
      status,
      confirmationNotes,
    );

    if (!resolved) {
      return null;
    }

    // Remove from active incidents
    await this.harmRepository.removeActiveIncident(userId, incidentId);

    // Check if this was the disabling incident
    const userState = await this.harmRepository.getUserHarmState(userId);
    if (userState.disablingIncidentId === incidentId) {
      // Check if there are other active incidents
      const activeIncidents = await this.harmRepository.findActiveIncidentsForUser(userId);

      if (activeIncidents.length === 0) {
        // Re-enable auto-adaptation
        await this.harmRepository.enableAutoAdaptation(userId);
      } else {
        // Update to next disabling incident
        await this.harmRepository.updateUserHarmState(userId, {
          disablingIncidentId: activeIncidents[0].id,
          pendingUserConfirmation: false,
        });
      }
    }

    // Log to audit using the correct method
    await this.auditService.logHarmIncident({
      eventType:
        status === HarmIncidentStatus.USER_CONFIRMED
          ? HarmAuditEventType.USER_CONFIRMED_PROCEED
          : HarmAuditEventType.INCIDENT_LOGGED,
      userId,
      goalId: incident.goalId ?? undefined,
      payload: {
        description: `Harm incident ${status === HarmIncidentStatus.USER_CONFIRMED ? 'user confirmed to proceed' : 'resolved'}`,
        metadata: {
          incidentId,
          status,
          confirmationNotes,
          resolvedAt: new Date().toISOString(),
        },
      },
    });

    this.logger.log('Harm incident resolved', {
      userId,
      incidentId,
      status,
    });

    return resolved;
  }

  /**
   * User confirms to proceed despite harm warnings.
   *
   * @param userId - User ID
   * @param incidentId - Incident ID
   * @param confirmationNotes - User's confirmation notes
   * @returns Resolved incident
   */
  async userConfirmProceed(
    userId: string,
    incidentId: string,
    confirmationNotes?: string,
  ): Promise<HarmIncident | null> {
    return this.resolveIncident({
      userId,
      incidentId,
      status: HarmIncidentStatus.USER_CONFIRMED,
      confirmationNotes,
    });
  }

  // ============================================
  // Helper Methods (Deterministic)
  // ============================================

  /**
   * Calculate severity for unrealistic tasks signal.
   * Deterministic based on count.
   */
  private calculateUnrealisticTasksSeverity(count: number): HarmSeverity {
    if (count >= 10) return HarmSeverity.EMERGENCY;
    if (count >= 7) return HarmSeverity.CRITICAL;
    return HarmSeverity.WARNING;
  }

  /**
   * Calculate severity for consistency drop signal.
   * Deterministic based on drop percentage.
   */
  private calculateConsistencyDropSeverity(dropPercent: number): HarmSeverity {
    if (dropPercent >= 50) return HarmSeverity.EMERGENCY;
    if (dropPercent >= 40) return HarmSeverity.CRITICAL;
    return HarmSeverity.WARNING;
  }

  /**
   * Calculate severity for user distress signal.
   * Deterministic based on matched keywords.
   */
  private calculateDistressSeverity(matchedKeywords: string[]): HarmSeverity {
    // High-severity keywords
    const highSeverityKeywords = [
      'quitting',
      'quit',
      'giving up',
      'give up',
      'burnout',
      'burning out',
    ];
    const hasHighSeverity = matchedKeywords.some((k) =>
      highSeverityKeywords.some((hk) => k.toLowerCase().includes(hk)),
    );

    if (hasHighSeverity) return HarmSeverity.CRITICAL;
    if (matchedKeywords.length >= 3) return HarmSeverity.CRITICAL;
    return HarmSeverity.WARNING;
  }

  /**
   * Get the most severe signal from a list.
   */
  private getMostSevereSignal(signals: HarmSignal[]): HarmSignal {
    const severityOrder = [HarmSeverity.WARNING, HarmSeverity.CRITICAL, HarmSeverity.EMERGENCY];

    return signals.reduce((most, current) => {
      const mostIndex = severityOrder.indexOf(most.severity);
      const currentIndex = severityOrder.indexOf(current.severity);
      return currentIndex > mostIndex ? current : most;
    });
  }

  /**
   * Determine response actions based on signal severity.
   */
  private determineResponseActions(signal: HarmSignal): {
    difficultyReduced: boolean;
    autoAdaptationDisabled: boolean;
    simplifiedTaskIds: string[];
    requiresUserConfirmation: boolean;
    newDifficultyLevel?: string;
    autoAdaptationReenableAt?: Date | null;
  } {
    switch (signal.severity) {
      case HarmSeverity.EMERGENCY:
        return {
          difficultyReduced: true,
          newDifficultyLevel: DifficultyLevelEnum.EASY,
          autoAdaptationDisabled: true,
          autoAdaptationReenableAt: null, // Requires user action
          simplifiedTaskIds: [],
          requiresUserConfirmation: true,
        };

      case HarmSeverity.CRITICAL:
        return {
          difficultyReduced: true,
          newDifficultyLevel: DifficultyLevelEnum.EASY,
          autoAdaptationDisabled: true,
          autoAdaptationReenableAt: null,
          simplifiedTaskIds: [],
          requiresUserConfirmation: true,
        };

      case HarmSeverity.WARNING:
      default:
        return {
          difficultyReduced: false,
          autoAdaptationDisabled: true,
          autoAdaptationReenableAt: null,
          simplifiedTaskIds: [],
          requiresUserConfirmation: true,
        };
    }
  }

  /**
   * Create a "no harm" result.
   */
  private createNoHarmResult(): HarmDetectionResult {
    return {
      harmDetected: false,
      signals: [],
      requiredActions: {
        forceDifficultyReduction: false,
        disableAutoAdaptation: false,
        logIncident: false,
        requireUserConfirmation: false,
      },
      evaluatedAt: new Date(),
    };
  }

  /**
   * Create a harm result with required actions.
   */
  private createHarmResult(signals: HarmSignal[]): HarmDetectionResult {
    const mostSevere = this.getMostSevereSignal(signals);

    // Determine required actions based on severity
    const forceDifficultyReduction =
      mostSevere.severity === HarmSeverity.CRITICAL ||
      mostSevere.severity === HarmSeverity.EMERGENCY;

    return {
      harmDetected: true,
      signals,
      requiredActions: {
        forceDifficultyReduction,
        disableAutoAdaptation: true, // Always disable on any harm
        logIncident: true, // Always log
        requireUserConfirmation: true, // Always require confirmation
        suggestedDifficultyLevel: forceDifficultyReduction ? DifficultyLevelEnum.EASY : undefined,
      },
      evaluatedAt: new Date(),
    };
  }

  /**
   * Get difficulty index for comparison.
   */
  private getDifficultyIndex(difficulty: DifficultyLevel): number {
    const index = DIFFICULTY_ORDER.findIndex((d) => d === difficulty);
    return index >= 0 ? index : 1; // Default to medium if not found
  }

  /**
   * Map HarmSignalType to HarmAuditEventType.
   */
  private mapSignalTypeToAuditEvent(signalType: HarmSignalType): HarmAuditEventType {
    switch (signalType) {
      case HarmSignalType.UNREALISTIC_TASKS:
        return HarmAuditEventType.UNREALISTIC_TASKS_FLAGGED;
      case HarmSignalType.CONSISTENCY_DROP:
        return HarmAuditEventType.CONSISTENCY_DROP_DETECTED;
      case HarmSignalType.USER_DISTRESS:
        return HarmAuditEventType.USER_DISTRESS_DETECTED;
      default:
        return HarmAuditEventType.INCIDENT_LOGGED;
    }
  }
}
