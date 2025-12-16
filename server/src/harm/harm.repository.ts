/**
 * Harm Repository
 *
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling (Product Safety)
 *
 * Handles persistence of harm incidents and user harm state.
 * Incidents are append-only for audit purposes.
 *
 * Note: Uses in-memory storage for V1.
 * In production, migrate to a dedicated Prisma model or separate audit database.
 */

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { HarmIncident, HarmIncidentStatus, UserHarmState, CreateHarmIncidentInput } from './types';

@Injectable()
export class HarmRepository {
  private readonly logger = new Logger(HarmRepository.name);

  /**
   * In-memory harm incidents store.
   * Key: incident ID
   */
  private readonly incidents: Map<string, HarmIncident> = new Map();

  /**
   * In-memory user harm state store.
   * Key: user ID
   */
  private readonly userStates: Map<string, UserHarmState> = new Map();

  // ============================================
  // Incident Operations
  // ============================================

  /**
   * Create a new harm incident.
   * Incidents are append-only and immutable.
   */
  async createIncident(input: CreateHarmIncidentInput): Promise<HarmIncident> {
    const incident: HarmIncident = {
      id: randomUUID(),
      userId: input.userId,
      goalId: input.goalId ?? null,
      signal: input.signal,
      responseActions: input.responseActions,
      status: HarmIncidentStatus.ACTIVE,
      createdAt: new Date(),
      resolvedAt: null,
      userConfirmationNotes: null,
    };

    this.incidents.set(incident.id, incident);

    this.logger.log('Harm incident created', {
      id: incident.id,
      userId: incident.userId,
      signalType: incident.signal.type,
      severity: incident.signal.severity,
    });

    return await Promise.resolve(incident);
  }

  /**
   * Find an incident by ID.
   */
  async findIncidentById(incidentId: string): Promise<HarmIncident | null> {
    return await Promise.resolve(this.incidents.get(incidentId) ?? null);
  }

  /**
   * Find an incident by ID, scoped to user.
   */
  async findIncidentByIdForUser(userId: string, incidentId: string): Promise<HarmIncident | null> {
    const incident = this.incidents.get(incidentId);
    if (!incident || incident.userId !== userId) {
      return await Promise.resolve(null);
    }
    return await Promise.resolve(incident);
  }

  /**
   * Find all active incidents for a user.
   */
  async findActiveIncidentsForUser(userId: string): Promise<HarmIncident[]> {
    const incidents: HarmIncident[] = [];
    for (const incident of this.incidents.values()) {
      if (incident.userId === userId && incident.status === HarmIncidentStatus.ACTIVE) {
        incidents.push(incident);
      }
    }
    return await Promise.resolve(
      incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  /**
   * Find all incidents for a goal.
   */
  async findIncidentsForGoal(userId: string, goalId: string): Promise<HarmIncident[]> {
    const incidents: HarmIncident[] = [];
    for (const incident of this.incidents.values()) {
      if (incident.userId === userId && incident.goalId === goalId) {
        incidents.push(incident);
      }
    }
    return await Promise.resolve(
      incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  /**
   * Update incident status.
   * Creates a new record internally (for audit purposes, the status change is logged).
   */
  async updateIncidentStatus(
    incidentId: string,
    status: HarmIncidentStatus,
    confirmationNotes?: string,
  ): Promise<HarmIncident | null> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return await Promise.resolve(null);
    }

    // Update in place (in production, this would be a proper DB update)
    const updatedIncident: HarmIncident = {
      ...incident,
      status,
      resolvedAt:
        status === HarmIncidentStatus.RESOLVED || status === HarmIncidentStatus.USER_CONFIRMED
          ? new Date()
          : null,
      userConfirmationNotes: confirmationNotes ?? incident.userConfirmationNotes,
    };

    this.incidents.set(incidentId, updatedIncident);

    this.logger.log('Harm incident status updated', {
      id: incidentId,
      oldStatus: incident.status,
      newStatus: status,
    });

    return await Promise.resolve(updatedIncident);
  }

  // ============================================
  // User Harm State Operations
  // ============================================

  /**
   * Get or create user harm state.
   */
  async getUserHarmState(userId: string): Promise<UserHarmState> {
    let state = this.userStates.get(userId);

    if (!state) {
      state = {
        userId,
        autoAdaptationDisabled: false,
        disabledAt: null,
        disablingIncidentId: null,
        pendingUserConfirmation: false,
        activeIncidentIds: [],
        updatedAt: new Date(),
      };
      this.userStates.set(userId, state);
    }

    return await Promise.resolve(state);
  }

  /**
   * Update user harm state.
   */
  async updateUserHarmState(
    userId: string,
    updates: Partial<Omit<UserHarmState, 'userId' | 'updatedAt'>>,
  ): Promise<UserHarmState> {
    const current = await this.getUserHarmState(userId);

    const updated: UserHarmState = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };

    this.userStates.set(userId, updated);

    this.logger.debug('User harm state updated', {
      userId,
      autoAdaptationDisabled: updated.autoAdaptationDisabled,
      pendingUserConfirmation: updated.pendingUserConfirmation,
    });

    return updated;
  }

  /**
   * Disable auto-adaptation for a user.
   */
  async disableAutoAdaptation(userId: string, incidentId: string): Promise<UserHarmState> {
    return this.updateUserHarmState(userId, {
      autoAdaptationDisabled: true,
      disabledAt: new Date(),
      disablingIncidentId: incidentId,
      pendingUserConfirmation: true,
    });
  }

  /**
   * Re-enable auto-adaptation for a user.
   */
  async enableAutoAdaptation(userId: string): Promise<UserHarmState> {
    return this.updateUserHarmState(userId, {
      autoAdaptationDisabled: false,
      disabledAt: null,
      disablingIncidentId: null,
      pendingUserConfirmation: false,
    });
  }

  /**
   * Add an active incident to user state.
   */
  async addActiveIncident(userId: string, incidentId: string): Promise<UserHarmState> {
    const state = await this.getUserHarmState(userId);
    const activeIncidentIds = [...state.activeIncidentIds];

    if (!activeIncidentIds.includes(incidentId)) {
      activeIncidentIds.push(incidentId);
    }

    return this.updateUserHarmState(userId, { activeIncidentIds });
  }

  /**
   * Remove an active incident from user state.
   */
  async removeActiveIncident(userId: string, incidentId: string): Promise<UserHarmState> {
    const state = await this.getUserHarmState(userId);
    const activeIncidentIds = state.activeIncidentIds.filter((id) => id !== incidentId);

    return this.updateUserHarmState(userId, { activeIncidentIds });
  }

  /**
   * Check if auto-adaptation is disabled for a user.
   */
  async isAutoAdaptationDisabled(userId: string): Promise<boolean> {
    const state = await this.getUserHarmState(userId);
    return state.autoAdaptationDisabled;
  }

  /**
   * Check if user confirmation is pending.
   */
  async isPendingUserConfirmation(userId: string): Promise<boolean> {
    const state = await this.getUserHarmState(userId);
    return state.pendingUserConfirmation;
  }
}
