import { Injectable } from '@nestjs/common';
import { Task, TaskStatus, DifficultyLevel, TaskFrequency, Prisma } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

/**
 * TaskRepository handles all database operations for Tasks.
 * All queries are scoped by userId through the Goal relation.
 *
 * @see BACKEND SPECIFICATION Section 10 - Security Rules
 * No business logic. No AI calls. CRUD only.
 */
@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new task for a goal.
   * Caller must verify goal ownership before calling.
   */
  async create(
    goalId: string,
    data: {
      title: string;
      difficulty?: DifficultyLevel;
      frequency?: TaskFrequency;
      estimatedDuration: number;
      isOptional?: boolean;
      orderIndex?: number;
    },
  ): Promise<Task> {
    return this.prisma.task.create({
      data: {
        goalId,
        title: data.title,
        difficulty: data.difficulty ?? 'medium',
        frequency: data.frequency ?? 'daily',
        estimatedDuration: data.estimatedDuration,
        isOptional: data.isOptional ?? false,
        orderIndex: data.orderIndex ?? 0,
      },
    });
  }

  /**
   * Create multiple tasks for a goal.
   * Caller must verify goal ownership before calling.
   */
  async createMany(
    goalId: string,
    tasks: Array<{
      title: string;
      difficulty?: DifficultyLevel;
      frequency?: TaskFrequency;
      estimatedDuration: number;
      isOptional?: boolean;
      orderIndex?: number;
    }>,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.task.createMany({
      data: tasks.map((task, index) => ({
        goalId,
        title: task.title,
        difficulty: task.difficulty ?? 'medium',
        frequency: task.frequency ?? 'daily',
        estimatedDuration: task.estimatedDuration,
        isOptional: task.isOptional ?? false,
        orderIndex: task.orderIndex ?? index,
      })),
    });
  }

  /**
   * Find a task by ID, scoped to user via goal.
   * Returns null if not found or goal not owned by user.
   */
  async findById(userId: string, taskId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
        goal: {
          userId,
        },
      },
    });
  }

  /**
   * Find a task by ID with its goal, scoped to user.
   */
  async findByIdWithGoal(
    userId: string,
    taskId: string,
  ): Promise<(Task & { goal: import('@prisma/client').Goal }) | null> {
    return this.prisma.task.findFirst({
      where: {
        id: taskId,
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
   * Find all tasks for a goal, scoped to user.
   */
  async findAllByGoal(
    userId: string,
    goalId: string,
    options?: {
      status?: TaskStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        goalId,
        goal: {
          userId,
        },
        ...(options?.status && { status: options.status }),
      },
      orderBy: { orderIndex: 'asc' },
      take: options?.limit,
      skip: options?.offset,
    });
  }

  /**
   * Count tasks for a goal, scoped to user.
   */
  async countByGoal(
    userId: string,
    goalId: string,
    options?: {
      status?: TaskStatus;
    },
  ): Promise<number> {
    return this.prisma.task.count({
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
   * Update a task, scoped to user.
   * Returns null if not found or not owned by user.
   */
  async update(
    userId: string,
    taskId: string,
    data: {
      title?: string;
      status?: TaskStatus;
      difficulty?: DifficultyLevel;
      frequency?: TaskFrequency;
      estimatedDuration?: number;
      actualDuration?: number;
      isOptional?: boolean;
      orderIndex?: number;
    },
  ): Promise<Task | null> {
    // First verify ownership via goal
    const existing = await this.findById(userId, taskId);
    if (!existing) {
      return null;
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data,
    });
  }

  /**
   * Mark a task as completed with optional actual duration.
   * Returns null if not found or not owned by user.
   */
  async markCompleted(
    userId: string,
    taskId: string,
    actualDuration?: number,
  ): Promise<Task | null> {
    return this.update(userId, taskId, {
      status: 'completed',
      actualDuration,
    });
  }

  /**
   * Mark a task as skipped.
   * Returns null if not found or not owned by user.
   */
  async markSkipped(userId: string, taskId: string): Promise<Task | null> {
    return this.update(userId, taskId, {
      status: 'skipped',
    });
  }

  /**
   * Mark a task as overdue.
   * Returns null if not found or not owned by user.
   */
  async markOverdue(userId: string, taskId: string): Promise<Task | null> {
    return this.update(userId, taskId, {
      status: 'overdue',
    });
  }

  /**
   * Reset task status to pending.
   * Returns null if not found or not owned by user.
   */
  async resetToPending(userId: string, taskId: string): Promise<Task | null> {
    return this.update(userId, taskId, {
      status: 'pending',
      actualDuration: undefined,
    });
  }

  /**
   * Delete a task, scoped to user.
   * Returns true if deleted, false if not found/not owned.
   */
  async delete(userId: string, taskId: string): Promise<boolean> {
    const existing = await this.findById(userId, taskId);
    if (!existing) {
      return false;
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return true;
  }

  /**
   * Delete all tasks for a goal.
   * Caller must verify goal ownership before calling.
   */
  async deleteAllByGoal(goalId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.task.deleteMany({
      where: { goalId },
    });
  }
}
