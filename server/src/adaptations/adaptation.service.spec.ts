/**
 * AdaptationService Unit Tests
 *
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 * @see BACKEND SPECIFICATION Section 12 - Testing Requirements
 *
 * Tests cover:
 * - Accept: accepting suggested adaptations, applying changes
 * - Reject: rejecting adaptations with 7-day block
 * - Rollback: rolling back within window, state restoration
 * - Re-application blocking: 7-day block enforcement
 *
 * All tests verify the adaptation lifecycle rules are enforced.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AdaptationService } from './adaptation.service';
import { AdaptationRepository } from './adaptation.repository';
import { GoalRepository } from '../goals/goal.repository';
import { TaskRepository } from '../tasks/task.repository';
import { ADAPTATION_BLOCK_DAYS, ROLLBACK_WINDOW_DAYS } from '../common/constants/domain.constants';
import { AdaptationErrorCode } from './types/adaptation.types';
import { Adaptation, Goal, Task, AdaptationStatus } from '@prisma/client';

// ============================================
// Mock Factories
// ============================================

const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'goal-1',
  userId: 'user-1',
  title: 'Test Goal',
  status: 'active',
  isArchived: false,
  planVersion: 1,
  originalPlan: 'Original plan text',
  consistencyMetrics: {},
  failureRecovery: {},
  progressSignals: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  goalId: 'goal-1',
  title: 'Test Task',
  status: 'pending',
  difficulty: 'medium',
  frequency: 'daily',
  estimatedDuration: 30,
  actualDuration: null,
  isOptional: false,
  orderIndex: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockAdaptation = (overrides: Partial<Adaptation> = {}): Adaptation => ({
  id: 'adaptation-1',
  goalId: 'goal-1',
  type: 'difficulty_change',
  reason: 'User struggling with current difficulty',
  previousState: {
    snapshotAt: new Date().toISOString(),
    goal: { title: 'Test Goal', status: 'active', planVersion: 1 },
    tasks: [
      {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending',
        difficulty: 'hard',
        frequency: 'daily',
        estimatedDuration: 30,
        orderIndex: 0,
      },
    ],
  },
  newState: {
    description: 'Reduce difficulty to medium',
    newDifficulty: 'medium',
    taskChanges: [{ taskId: 'task-1', changes: { difficulty: 'medium' } }],
  },
  status: 'suggested',
  createdBy: 'system',
  processedAt: null,
  blockedUntil: null,
  createdAt: new Date(),
  ...overrides,
});

// ============================================
// Mock Repository Setup
// ============================================

const mockAdaptationRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdWithGoal: jest.fn(),
  findAllByGoal: jest.fn(),
  findPendingByGoal: jest.fn(),
  countByGoal: jest.fn(),
  isAdaptationBlocked: jest.fn(),
  markAccepted: jest.fn(),
  markRejected: jest.fn(),
  markRolledBack: jest.fn(),
};

const mockGoalRepository = {
  findById: jest.fn(),
  findByIdWithTasks: jest.fn(),
  incrementPlanVersion: jest.fn(),
};

const mockTaskRepository = {
  findAllByGoal: jest.fn(),
  update: jest.fn(),
};

// ============================================
// Test Suite
// ============================================

describe('AdaptationService', () => {
  let service: AdaptationService;
  const userId = 'user-1';
  const goalId = 'goal-1';
  const adaptationId = 'adaptation-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdaptationService,
        { provide: AdaptationRepository, useValue: mockAdaptationRepository },
        { provide: GoalRepository, useValue: mockGoalRepository },
        { provide: TaskRepository, useValue: mockTaskRepository },
      ],
    }).compile();

    service = module.get<AdaptationService>(AdaptationService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // ============================================
  // Store Suggestion Tests
  // ============================================

  describe('storeSuggestion', () => {
    const mockGoal = createMockGoal();
    const mockTasks = [createMockTask()];

    beforeEach(() => {
      mockGoalRepository.findById.mockResolvedValue(mockGoal);
      mockTaskRepository.findAllByGoal.mockResolvedValue(mockTasks);
      mockAdaptationRepository.isAdaptationBlocked.mockResolvedValue(false);
      mockAdaptationRepository.create.mockResolvedValue(createMockAdaptation());
    });

    it('should store a new adaptation suggestion', async () => {
      const result = await service.storeSuggestion({
        userId,
        goalId,
        type: 'difficulty_change',
        reason: 'User struggling',
        newState: { description: 'Reduce difficulty', newDifficulty: 'easy' },
        createdBy: 'system',
      });

      expect(result.success).toBe(true);
      expect(result.adaptation).toBeDefined();
      expect(mockAdaptationRepository.create).toHaveBeenCalled();
    });

    it('should fail if goal not found', async () => {
      mockGoalRepository.findById.mockResolvedValue(null);

      const result = await service.storeSuggestion({
        userId,
        goalId,
        type: 'difficulty_change',
        reason: 'User struggling',
        newState: { description: 'Reduce difficulty', newDifficulty: 'easy' },
        createdBy: 'system',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.GOAL_NOT_FOUND);
    });

    it('should fail if adaptation type is blocked', async () => {
      mockAdaptationRepository.isAdaptationBlocked.mockResolvedValue(true);

      const result = await service.storeSuggestion({
        userId,
        goalId,
        type: 'difficulty_change',
        reason: 'User struggling',
        newState: { description: 'Reduce difficulty', newDifficulty: 'easy' },
        createdBy: 'system',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.BLOCKED);
      expect(result.error?.message).toContain(`${ADAPTATION_BLOCK_DAYS} days`);
    });
  });

  // ============================================
  // Accept Adaptation Tests
  // ============================================

  describe('acceptAdaptation', () => {
    const mockGoal = createMockGoal();
    const mockAdaptation = createMockAdaptation({ status: 'suggested' });
    const mockAdaptationWithGoal = { ...mockAdaptation, goal: mockGoal };

    beforeEach(() => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue(mockAdaptationWithGoal);
      mockAdaptationRepository.markAccepted.mockResolvedValue({
        ...mockAdaptation,
        status: 'accepted',
        processedAt: new Date(),
      });
      mockTaskRepository.update.mockResolvedValue(createMockTask());
      mockGoalRepository.incrementPlanVersion.mockResolvedValue(mockGoal);
    });

    it('should accept a suggested adaptation', async () => {
      const result = await service.acceptAdaptation({ userId, adaptationId });

      expect(result.success).toBe(true);
      expect(result.adaptation?.status).toBe('accepted');
      expect(mockAdaptationRepository.markAccepted).toHaveBeenCalledWith(userId, adaptationId);
    });

    it('should apply task changes on acceptance', async () => {
      await service.acceptAdaptation({ userId, adaptationId });

      expect(mockTaskRepository.update).toHaveBeenCalled();
      expect(mockGoalRepository.incrementPlanVersion).toHaveBeenCalledWith(userId, goalId);
    });

    it('should return applied changes count', async () => {
      const result = await service.acceptAdaptation({ userId, adaptationId });

      expect(result.appliedChanges).toBeDefined();
      expect(result.appliedChanges?.tasksModified).toBeGreaterThanOrEqual(0);
    });

    it('should fail if adaptation not found', async () => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue(null);

      const result = await service.acceptAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.NOT_FOUND);
    });

    it('should fail if adaptation is not in suggested status', async () => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptationWithGoal,
        status: 'accepted',
      });

      const result = await service.acceptAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.INVALID_STATUS);
      expect(result.error?.message).toContain("Only 'suggested'");
    });

    it('should fail if adaptation is already rejected', async () => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptationWithGoal,
        status: 'rejected',
      });

      const result = await service.acceptAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.INVALID_STATUS);
    });

    it('should fail if adaptation is already rolled back', async () => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptationWithGoal,
        status: 'rolled_back',
      });

      const result = await service.acceptAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.INVALID_STATUS);
    });
  });

  // ============================================
  // Reject Adaptation Tests
  // ============================================

  describe('rejectAdaptation', () => {
    const mockAdaptation = createMockAdaptation({ status: 'suggested' });

    beforeEach(() => {
      mockAdaptationRepository.findById.mockResolvedValue(mockAdaptation);
    });

    it('should reject a suggested adaptation', async () => {
      const blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + ADAPTATION_BLOCK_DAYS);

      mockAdaptationRepository.markRejected.mockResolvedValue({
        ...mockAdaptation,
        status: 'rejected',
        blockedUntil,
      });

      const result = await service.rejectAdaptation({ userId, adaptationId });

      expect(result.success).toBe(true);
      expect(result.adaptation?.status).toBe('rejected');
      expect(mockAdaptationRepository.markRejected).toHaveBeenCalledWith(userId, adaptationId);
    });

    it('should set blockedUntil date on rejection', async () => {
      const now = new Date();
      const expectedBlockedUntil = new Date(now);
      expectedBlockedUntil.setDate(expectedBlockedUntil.getDate() + ADAPTATION_BLOCK_DAYS);

      mockAdaptationRepository.markRejected.mockResolvedValue({
        ...mockAdaptation,
        status: 'rejected',
        blockedUntil: expectedBlockedUntil,
      });

      const result = await service.rejectAdaptation({ userId, adaptationId });

      expect(result.blockedUntil).toBeDefined();
      // Verify blockedUntil is approximately 7 days from now
      const blockDays = Math.round(
        (result.blockedUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(blockDays).toBe(ADAPTATION_BLOCK_DAYS);
    });

    it('should fail if adaptation not found', async () => {
      mockAdaptationRepository.findById.mockResolvedValue(null);

      const result = await service.rejectAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.NOT_FOUND);
    });

    it('should fail if adaptation is not in suggested status', async () => {
      mockAdaptationRepository.findById.mockResolvedValue({
        ...mockAdaptation,
        status: 'accepted',
      });

      const result = await service.rejectAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.INVALID_STATUS);
      expect(result.error?.message).toContain("Only 'suggested'");
    });

    it('should fail if adaptation is already rejected', async () => {
      mockAdaptationRepository.findById.mockResolvedValue({
        ...mockAdaptation,
        status: 'rejected',
      });

      const result = await service.rejectAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.INVALID_STATUS);
    });
  });

  // ============================================
  // Rollback Adaptation Tests
  // ============================================

  describe('rollbackAdaptation', () => {
    const mockGoal = createMockGoal();
    const processedAt = new Date();
    processedAt.setDate(processedAt.getDate() - 2); // 2 days ago (within window)

    const mockAcceptedAdaptation = createMockAdaptation({
      status: 'accepted',
      processedAt,
    });
    const mockAdaptationWithGoal = { ...mockAcceptedAdaptation, goal: mockGoal };

    beforeEach(() => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue(mockAdaptationWithGoal);
      mockTaskRepository.update.mockResolvedValue(createMockTask());
    });

    it('should rollback an accepted adaptation within rollback window', async () => {
      mockAdaptationRepository.markRolledBack.mockResolvedValue({
        ...mockAcceptedAdaptation,
        status: 'rolled_back',
        blockedUntil: new Date(Date.now() + ADAPTATION_BLOCK_DAYS * 24 * 60 * 60 * 1000),
      });

      const result = await service.rollbackAdaptation({ userId, adaptationId });

      expect(result.success).toBe(true);
      expect(result.adaptation?.status).toBe('rolled_back');
      expect(mockAdaptationRepository.markRolledBack).toHaveBeenCalledWith(userId, adaptationId);
    });

    it('should restore previous task state on rollback', async () => {
      mockAdaptationRepository.markRolledBack.mockResolvedValue({
        ...mockAcceptedAdaptation,
        status: 'rolled_back',
      });

      const result = await service.rollbackAdaptation({ userId, adaptationId });

      expect(result.restoredState).toBeDefined();
      expect(result.restoredState?.tasks).toHaveLength(1);
      expect(mockTaskRepository.update).toHaveBeenCalled();
    });

    it('should fail if adaptation not found', async () => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue(null);

      const result = await service.rollbackAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.NOT_FOUND);
    });

    it('should fail if adaptation is not in accepted status', async () => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptationWithGoal,
        status: 'suggested',
      });

      const result = await service.rollbackAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.INVALID_STATUS);
      expect(result.error?.message).toContain("Only 'accepted'");
    });

    it('should fail if rollback window has expired', async () => {
      const expiredProcessedAt = new Date();
      expiredProcessedAt.setDate(expiredProcessedAt.getDate() - (ROLLBACK_WINDOW_DAYS + 1));

      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptationWithGoal,
        processedAt: expiredProcessedAt,
      });

      const result = await service.rollbackAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.ROLLBACK_WINDOW_EXPIRED);
      expect(result.error?.message).toContain(`${ROLLBACK_WINDOW_DAYS} days`);
    });

    it('should fail if processedAt is null (never accepted)', async () => {
      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptationWithGoal,
        status: 'accepted',
        processedAt: null,
      });

      const result = await service.rollbackAdaptation({ userId, adaptationId });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AdaptationErrorCode.ROLLBACK_WINDOW_EXPIRED);
    });

    it('should allow rollback on exactly the last day of window', async () => {
      // processedAt = 7 days ago + 1 hour, so deadline is 1 hour from now
      // This ensures we're within the window by a small margin
      const processedAt = new Date();
      processedAt.setDate(processedAt.getDate() - ROLLBACK_WINDOW_DAYS);
      processedAt.setHours(processedAt.getHours() + 1);

      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptationWithGoal,
        processedAt,
      });
      mockAdaptationRepository.markRolledBack.mockResolvedValue({
        ...mockAcceptedAdaptation,
        status: 'rolled_back',
      });

      const result = await service.rollbackAdaptation({ userId, adaptationId });

      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // Re-application Blocking Tests
  // ============================================

  describe('Re-application Blocking', () => {
    describe('after rejection', () => {
      it('should block same type adaptation after rejection', async () => {
        mockAdaptationRepository.isAdaptationBlocked.mockResolvedValue(true);
        mockGoalRepository.findById.mockResolvedValue(createMockGoal());

        const result = await service.storeSuggestion({
          userId,
          goalId,
          type: 'difficulty_change',
          reason: 'Another attempt',
          newState: { description: 'Try again', newDifficulty: 'easy' },
          createdBy: 'system',
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(AdaptationErrorCode.BLOCKED);
      });

      it('should allow different type adaptation after rejection', async () => {
        mockAdaptationRepository.isAdaptationBlocked.mockResolvedValue(false);
        mockGoalRepository.findById.mockResolvedValue(createMockGoal());
        mockTaskRepository.findAllByGoal.mockResolvedValue([createMockTask()]);
        mockAdaptationRepository.create.mockResolvedValue(
          createMockAdaptation({ type: 'reschedule' }),
        );

        const result = await service.storeSuggestion({
          userId,
          goalId,
          type: 'reschedule', // Different type
          reason: 'Reschedule tasks',
          newState: { description: 'Reschedule' },
          createdBy: 'system',
        });

        expect(result.success).toBe(true);
        expect(mockAdaptationRepository.isAdaptationBlocked).toHaveBeenCalledWith(
          userId,
          goalId,
          'reschedule',
        );
      });

      it('should verify 7-day block period is enforced', async () => {
        // First, reject an adaptation
        const mockAdaptation = createMockAdaptation({ status: 'suggested' });
        mockAdaptationRepository.findById.mockResolvedValue(mockAdaptation);

        const blockedUntil = new Date();
        blockedUntil.setDate(blockedUntil.getDate() + ADAPTATION_BLOCK_DAYS);

        mockAdaptationRepository.markRejected.mockResolvedValue({
          ...mockAdaptation,
          status: 'rejected',
          blockedUntil,
        });

        const rejectResult = await service.rejectAdaptation({ userId, adaptationId });
        expect(rejectResult.blockedUntil).toBeDefined();

        // Verify block duration
        const blockDuration = rejectResult.blockedUntil!.getTime() - Date.now();
        const blockDays = Math.ceil(blockDuration / (1000 * 60 * 60 * 24));
        expect(blockDays).toBe(ADAPTATION_BLOCK_DAYS);
      });
    });

    describe('after rollback', () => {
      it('should block same type adaptation after rollback', async () => {
        // Setup: accepted adaptation that gets rolled back
        const processedAt = new Date();
        processedAt.setDate(processedAt.getDate() - 1);
        const mockGoal = createMockGoal();
        const mockAdaptation = createMockAdaptation({
          status: 'accepted',
          processedAt,
        });

        mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
          ...mockAdaptation,
          goal: mockGoal,
        });
        mockTaskRepository.update.mockResolvedValue(createMockTask());

        const blockedUntil = new Date();
        blockedUntil.setDate(blockedUntil.getDate() + ADAPTATION_BLOCK_DAYS);

        mockAdaptationRepository.markRolledBack.mockResolvedValue({
          ...mockAdaptation,
          status: 'rolled_back',
          blockedUntil,
        });

        // Execute rollback
        await service.rollbackAdaptation({ userId, adaptationId });

        // Now try to create same type adaptation - should be blocked
        mockAdaptationRepository.isAdaptationBlocked.mockResolvedValue(true);
        mockGoalRepository.findById.mockResolvedValue(mockGoal);

        const result = await service.storeSuggestion({
          userId,
          goalId,
          type: 'difficulty_change',
          reason: 'Try again after rollback',
          newState: { description: 'Another attempt', newDifficulty: 'easy' },
          createdBy: 'system',
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(AdaptationErrorCode.BLOCKED);
      });
    });
  });

  // ============================================
  // Query Method Tests
  // ============================================

  describe('getAdaptationDetails', () => {
    it('should return adaptation with rollback eligibility info', async () => {
      const processedAt = new Date();
      processedAt.setDate(processedAt.getDate() - 2);
      const mockGoal = createMockGoal();
      const mockAdaptation = createMockAdaptation({
        status: 'accepted',
        processedAt,
      });

      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptation,
        goal: mockGoal,
      });

      const result = await service.getAdaptationDetails(userId, adaptationId);

      expect(result).toBeDefined();
      expect(result?.isWithinRollbackWindow).toBe(true);
      expect(result?.canBeRolledBack).toBe(true);
    });

    it('should indicate rollback not available for suggested adaptations', async () => {
      const mockGoal = createMockGoal();
      const mockAdaptation = createMockAdaptation({ status: 'suggested' });

      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptation,
        goal: mockGoal,
      });

      const result = await service.getAdaptationDetails(userId, adaptationId);

      expect(result?.canBeRolledBack).toBe(false);
    });

    it('should indicate rollback not available after window expires', async () => {
      const expiredProcessedAt = new Date();
      expiredProcessedAt.setDate(expiredProcessedAt.getDate() - (ROLLBACK_WINDOW_DAYS + 1));
      const mockGoal = createMockGoal();
      const mockAdaptation = createMockAdaptation({
        status: 'accepted',
        processedAt: expiredProcessedAt,
      });

      mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
        ...mockAdaptation,
        goal: mockGoal,
      });

      const result = await service.getAdaptationDetails(userId, adaptationId);

      expect(result?.isWithinRollbackWindow).toBe(false);
      expect(result?.canBeRolledBack).toBe(false);
    });
  });

  describe('listAdaptations', () => {
    it('should list adaptations with pagination', async () => {
      const adaptations = [createMockAdaptation(), createMockAdaptation({ id: 'adaptation-2' })];

      mockAdaptationRepository.findAllByGoal.mockResolvedValue(adaptations);
      mockAdaptationRepository.countByGoal.mockResolvedValue(5);

      const result = await service.listAdaptations(userId, goalId, { limit: 2, offset: 0 });

      expect(result.adaptations).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it('should filter by status', async () => {
      mockAdaptationRepository.findAllByGoal.mockResolvedValue([]);
      mockAdaptationRepository.countByGoal.mockResolvedValue(0);

      await service.listAdaptations(userId, goalId, { status: 'suggested' });

      expect(mockAdaptationRepository.findAllByGoal).toHaveBeenCalledWith(
        userId,
        goalId,
        expect.objectContaining({ status: 'suggested' }),
      );
    });
  });

  describe('isAdaptationBlocked', () => {
    it('should delegate to repository', async () => {
      mockAdaptationRepository.isAdaptationBlocked.mockResolvedValue(true);

      const result = await service.isAdaptationBlocked(userId, goalId, 'difficulty_change');

      expect(result).toBe(true);
      expect(mockAdaptationRepository.isAdaptationBlocked).toHaveBeenCalledWith(
        userId,
        goalId,
        'difficulty_change',
      );
    });
  });

  // ============================================
  // Status Transition Matrix Tests
  // ============================================

  describe('Status Transition Rules', () => {
    const testCases = [
      { from: 'suggested', action: 'accept', expected: 'success' },
      { from: 'suggested', action: 'reject', expected: 'success' },
      { from: 'suggested', action: 'rollback', expected: 'INVALID_STATUS' },
      { from: 'accepted', action: 'accept', expected: 'INVALID_STATUS' },
      { from: 'accepted', action: 'reject', expected: 'INVALID_STATUS' },
      { from: 'accepted', action: 'rollback', expected: 'success' },
      { from: 'rejected', action: 'accept', expected: 'INVALID_STATUS' },
      { from: 'rejected', action: 'reject', expected: 'INVALID_STATUS' },
      { from: 'rejected', action: 'rollback', expected: 'INVALID_STATUS' },
      { from: 'rolled_back', action: 'accept', expected: 'INVALID_STATUS' },
      { from: 'rolled_back', action: 'reject', expected: 'INVALID_STATUS' },
      { from: 'rolled_back', action: 'rollback', expected: 'INVALID_STATUS' },
    ];

    testCases.forEach(({ from, action, expected }) => {
      it(`should ${expected === 'success' ? 'allow' : 'reject'} ${action} on ${from} status`, async () => {
        const processedAt = new Date();
        processedAt.setDate(processedAt.getDate() - 1);
        const mockGoal = createMockGoal();
        const mockAdaptation = createMockAdaptation({
          status: from as AdaptationStatus,
          processedAt: from === 'accepted' ? processedAt : null,
        });

        mockAdaptationRepository.findById.mockResolvedValue(mockAdaptation);
        mockAdaptationRepository.findByIdWithGoal.mockResolvedValue({
          ...mockAdaptation,
          goal: mockGoal,
        });

        if (expected === 'success') {
          mockAdaptationRepository.markAccepted.mockResolvedValue({
            ...mockAdaptation,
            status: 'accepted',
            processedAt: new Date(),
          });
          mockAdaptationRepository.markRejected.mockResolvedValue({
            ...mockAdaptation,
            status: 'rejected',
            blockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          mockAdaptationRepository.markRolledBack.mockResolvedValue({
            ...mockAdaptation,
            status: 'rolled_back',
          });
          mockTaskRepository.update.mockResolvedValue(createMockTask());
          mockGoalRepository.incrementPlanVersion.mockResolvedValue(mockGoal);
        }

        let result: { success: boolean; error?: { code: string } } | undefined;
        switch (action) {
          case 'accept':
            result = await service.acceptAdaptation({ userId, adaptationId });
            break;
          case 'reject':
            result = await service.rejectAdaptation({ userId, adaptationId });
            break;
          case 'rollback':
            result = await service.rollbackAdaptation({ userId, adaptationId });
            break;
        }

        expect(result).toBeDefined();
        if (expected === 'success') {
          expect(result!.success).toBe(true);
        } else {
          expect(result!.success).toBe(false);
          expect(result!.error?.code).toBe(AdaptationErrorCode.INVALID_STATUS);
        }
      });
    });
  });
});
