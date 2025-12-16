import { Injectable } from '@nestjs/common';
import { Goal, GoalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

/**
 * GoalRepository handles all database operations for Goals.
 * All queries are scoped by userId for data isolation.
 *
 * @see BACKEND SPECIFICATION Section 10 - Security Rules
 * No business logic. No AI calls. CRUD only.
 */
@Injectable()
export class GoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new goal for a user.
   */
  async create(
    userId: string,
    data: {
      title: string;
      originalPlan?: string;
      consistencyMetrics?: Prisma.InputJsonValue;
      failureRecovery?: Prisma.InputJsonValue;
      progressSignals?: Prisma.InputJsonValue;
    },
  ): Promise<Goal> {
    return this.prisma.goal.create({
      data: {
        userId,
        title: data.title,
        originalPlan: data.originalPlan,
        consistencyMetrics: data.consistencyMetrics ?? {},
        failureRecovery: data.failureRecovery ?? {},
        progressSignals: data.progressSignals ?? {},
      },
    });
  }

  /**
   * Find a goal by ID, scoped to user.
   * Returns null if not found or not owned by user.
   */
  async findById(userId: string, goalId: string): Promise<Goal | null> {
    return this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    });
  }

  /**
   * Find a goal by ID with tasks, scoped to user.
   */
  async findByIdWithTasks(
    userId: string,
    goalId: string,
  ): Promise<(Goal & { tasks: import('@prisma/client').Task[] }) | null> {
    return this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  /**
   * Find all goals for a user.
   */
  async findAllByUser(
    userId: string,
    options?: {
      status?: GoalStatus;
      isArchived?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: {
        userId,
        ...(options?.status && { status: options.status }),
        ...(options?.isArchived !== undefined && { isArchived: options.isArchived }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });
  }

  /**
   * Count goals for a user.
   */
  async countByUser(
    userId: string,
    options?: {
      status?: GoalStatus;
      isArchived?: boolean;
    },
  ): Promise<number> {
    return this.prisma.goal.count({
      where: {
        userId,
        ...(options?.status && { status: options.status }),
        ...(options?.isArchived !== undefined && { isArchived: options.isArchived }),
      },
    });
  }

  /**
   * Update a goal, scoped to user.
   * Returns null if not found or not owned by user.
   */
  async update(
    userId: string,
    goalId: string,
    data: {
      title?: string;
      status?: GoalStatus;
      isArchived?: boolean;
      planVersion?: number;
      consistencyMetrics?: Prisma.InputJsonValue;
      failureRecovery?: Prisma.InputJsonValue;
      progressSignals?: Prisma.InputJsonValue;
    },
  ): Promise<Goal | null> {
    // First verify ownership
    const existing = await this.findById(userId, goalId);
    if (!existing) {
      return null;
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data,
    });
  }

  /**
   * Increment plan version for a goal.
   * Used when an adaptation is accepted.
   */
  async incrementPlanVersion(userId: string, goalId: string): Promise<Goal | null> {
    const existing = await this.findById(userId, goalId);
    if (!existing) {
      return null;
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        planVersion: { increment: 1 },
      },
    });
  }

  /**
   * Archive a goal, scoped to user.
   */
  async archive(userId: string, goalId: string): Promise<Goal | null> {
    return this.update(userId, goalId, { isArchived: true });
  }

  /**
   * Delete a goal, scoped to user.
   * Returns true if deleted, false if not found/not owned.
   */
  async delete(userId: string, goalId: string): Promise<boolean> {
    const existing = await this.findById(userId, goalId);
    if (!existing) {
      return false;
    }

    await this.prisma.goal.delete({
      where: { id: goalId },
    });

    return true;
  }
}
