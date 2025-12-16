import { Injectable } from '@nestjs/common';
import {
  Adaptation,
  AdaptationStatus,
  AdaptationType,
  AdaptationCreator,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

/**
 * AdaptationRepository handles all database operations for Adaptations.
 * All queries are scoped by userId through the Goal relation.
 *
 * @see BACKEND SPECIFICATION Section 5 - Adaptation Model
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 * @see BACKEND SPECIFICATION Section 10 - Security Rules
 *
 * No business logic. No AI calls. CRUD only.
 */
@Injectable()
export class AdaptationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new adaptation proposal.
   * Caller must verify goal ownership before calling.
   */
  async create(
    goalId: string,
    data: {
      type: AdaptationType;
      reason: string;
      previousState: Prisma.InputJsonValue;
      newState: Prisma.InputJsonValue;
      createdBy: AdaptationCreator;
    },
  ): Promise<Adaptation> {
    return this.prisma.adaptation.create({
      data: {
        goalId,
        type: data.type,
        reason: data.reason,
        previousState: data.previousState,
        newState: data.newState,
        createdBy: data.createdBy,
        status: 'suggested',
      },
    });
  }

  /**
   * Find an adaptation by ID, scoped to user via goal.
   * Returns null if not found or goal not owned by user.
   */
  async findById(userId: string, adaptationId: string): Promise<Adaptation | null> {
    return this.prisma.adaptation.findFirst({
      where: {
        id: adaptationId,
        goal: {
          userId,
        },
      },
    });
  }

  /**
   * Find an adaptation by ID with its goal, scoped to user.
   */
  async findByIdWithGoal(
    userId: string,
    adaptationId: string,
  ): Promise<(Adaptation & { goal: import('@prisma/client').Goal }) | null> {
    return this.prisma.adaptation.findFirst({
      where: {
        id: adaptationId,
        goal: {
          userId,
        },
      },
      include: {
        goal: true,
      },
    });
  }

  /**
   * Find all adaptations for a goal, scoped to user.
   */
  async findAllByGoal(
    userId: string,
    goalId: string,
    options?: {
      status?: AdaptationStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<Adaptation[]> {
    return this.prisma.adaptation.findMany({
      where: {
        goalId,
        goal: {
          userId,
        },
        ...(options?.status && { status: options.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });
  }

  /**
   * Find pending (suggested) adaptations for a goal.
   */
  async findPendingByGoal(userId: string, goalId: string): Promise<Adaptation[]> {
    return this.findAllByGoal(userId, goalId, { status: 'suggested' });
  }

  /**
   * Count adaptations for a goal, scoped to user.
   */
  async countByGoal(
    userId: string,
    goalId: string,
    options?: {
      status?: AdaptationStatus;
    },
  ): Promise<number> {
    return this.prisma.adaptation.count({
      where: {
        goalId,
        goal: {
          userId,
        },
        ...(options?.status && { status: options.status }),
      },
    });
  }

  /**
   * Check if a similar adaptation is blocked (rejected within 7 days).
   * @see LLM INPUT CONTRACT Section 8 - Rejected → block re-apply for 7 days
   */
  async isAdaptationBlocked(
    userId: string,
    goalId: string,
    type: AdaptationType,
  ): Promise<boolean> {
    const now = new Date();

    const blockedAdaptation = await this.prisma.adaptation.findFirst({
      where: {
        goalId,
        type,
        status: 'rejected',
        blockedUntil: {
          gt: now,
        },
        goal: {
          userId,
        },
      },
    });

    return blockedAdaptation !== null;
  }

  /**
   * Mark adaptation as accepted.
   * Returns null if not found or not owned by user.
   */
  async markAccepted(userId: string, adaptationId: string): Promise<Adaptation | null> {
    const existing = await this.findById(userId, adaptationId);
    if (!existing) {
      return null;
    }

    return this.prisma.adaptation.update({
      where: { id: adaptationId },
      data: {
        status: 'accepted',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark adaptation as rejected with 7-day block.
   * Returns null if not found or not owned by user.
   */
  async markRejected(userId: string, adaptationId: string): Promise<Adaptation | null> {
    const existing = await this.findById(userId, adaptationId);
    if (!existing) {
      return null;
    }

    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + 7);

    return this.prisma.adaptation.update({
      where: { id: adaptationId },
      data: {
        status: 'rejected',
        processedAt: new Date(),
        blockedUntil,
      },
    });
  }

  /**
   * Mark adaptation as rolled back.
   * Returns null if not found or not owned by user.
   */
  async markRolledBack(userId: string, adaptationId: string): Promise<Adaptation | null> {
    const existing = await this.findById(userId, adaptationId);
    if (!existing) {
      return null;
    }

    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + 7);

    return this.prisma.adaptation.update({
      where: { id: adaptationId },
      data: {
        status: 'rolled_back',
        processedAt: new Date(),
        blockedUntil,
      },
    });
  }

  /**
   * Get the most recent accepted adaptation for a goal.
   * Used for rollback functionality.
   */
  async findLatestAccepted(userId: string, goalId: string): Promise<Adaptation | null> {
    return this.prisma.adaptation.findFirst({
      where: {
        goalId,
        status: 'accepted',
        goal: {
          userId,
        },
      },
      orderBy: { processedAt: 'desc' },
    });
  }

  /**
   * Delete an adaptation, scoped to user.
   * Returns true if deleted, false if not found/not owned.
   */
  async delete(userId: string, adaptationId: string): Promise<boolean> {
    const existing = await this.findById(userId, adaptationId);
    if (!existing) {
      return false;
    }

    await this.prisma.adaptation.delete({
      where: { id: adaptationId },
    });

    return true;
  }
}
