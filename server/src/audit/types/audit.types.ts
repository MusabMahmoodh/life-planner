/**
 * Audit Event Types
 *
 * @see BACKEND SPECIFICATION Section 8 - All adaptations must be auditable
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling (log incident)
 *
 * Defines the types of events that can be audited.
 * This module provides append-only, immutable audit logging.
 */

// ============================================
// Audit Event Categories
// ============================================

/**
 * Categories of audit events.
 */
export enum AuditEventCategory {
  /** Adaptation lifecycle events */
  ADAPTATION = 'adaptation',

  /** Harm detection and safety events */
  HARM = 'harm',

  /** Goal lifecycle events */
  GOAL = 'goal',

  /** Authentication and authorization events */
  AUTH = 'auth',

  /** System events */
  SYSTEM = 'system',
}

// ============================================
// Adaptation Audit Events
// ============================================

/**
 * Adaptation-related audit event types.
 *
 * @see BACKEND SPECIFICATION Section 8 - Adaptation Lifecycle
 */
export enum AdaptationAuditEventType {
  /** Behavioral engine triggered adaptation */
  ADAPTATION_TRIGGERED = 'adaptation.triggered',

  /** AI proposed an adaptation */
  ADAPTATION_PROPOSED = 'adaptation.proposed',

  /** Adaptation was stored as suggested */
  ADAPTATION_STORED = 'adaptation.stored',

  /** User accepted the adaptation */
  ADAPTATION_ACCEPTED = 'adaptation.accepted',

  /** User rejected the adaptation */
  ADAPTATION_REJECTED = 'adaptation.rejected',

  /** Adaptation was rolled back */
  ADAPTATION_ROLLED_BACK = 'adaptation.rolled_back',

  /** Adaptation expired without user action */
  ADAPTATION_EXPIRED = 'adaptation.expired',

  /** Adaptation application failed */
  ADAPTATION_APPLY_FAILED = 'adaptation.apply_failed',

  /** Adaptation rollback failed */
  ADAPTATION_ROLLBACK_FAILED = 'adaptation.rollback_failed',
}

// ============================================
// Harm Audit Events
// ============================================

/**
 * Harm-related audit event types.
 *
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling
 */
export enum HarmAuditEventType {
  /** User marked tasks as unrealistic (≥5) */
  UNREALISTIC_TASKS_FLAGGED = 'harm.unrealistic_tasks_flagged',

  /** Consistency dropped ≥30% post-adaptation */
  CONSISTENCY_DROP_DETECTED = 'harm.consistency_drop_detected',

  /** User expressed overwhelmed/quitting signals */
  USER_DISTRESS_DETECTED = 'harm.user_distress_detected',

  /** System forced difficulty reduction */
  DIFFICULTY_REDUCTION_FORCED = 'harm.difficulty_reduction_forced',

  /** Auto-adaptation was disabled due to harm */
  AUTO_ADAPTATION_DISABLED = 'harm.auto_adaptation_disabled',

  /** Harm incident logged for review */
  INCIDENT_LOGGED = 'harm.incident_logged',

  /** User confirmed to proceed after harm warning */
  USER_CONFIRMED_PROCEED = 'harm.user_confirmed_proceed',
}

// ============================================
// Goal Audit Events
// ============================================

/**
 * Goal-related audit event types.
 */
export enum GoalAuditEventType {
  /** Goal was created */
  GOAL_CREATED = 'goal.created',

  /** Goal status changed */
  GOAL_STATUS_CHANGED = 'goal.status_changed',

  /** Goal was archived */
  GOAL_ARCHIVED = 'goal.archived',

  /** Goal plan version incremented */
  GOAL_PLAN_VERSION_INCREMENTED = 'goal.plan_version_incremented',
}

/**
 * Union type of all audit event types.
 */
export type AuditEventType = AdaptationAuditEventType | HarmAuditEventType | GoalAuditEventType;

// ============================================
// Audit Record Types
// ============================================

/**
 * Base audit record structure.
 * All audit records are immutable once created.
 */
export interface AuditRecord {
  /** Unique audit record ID */
  id: string;

  /** Event category */
  category: AuditEventCategory;

  /** Specific event type */
  eventType: AuditEventType;

  /** User ID (may be null for system events) */
  userId: string | null;

  /** Related entity ID (goalId, adaptationId, etc.) */
  entityId: string | null;

  /** Entity type for the related entity */
  entityType: 'goal' | 'task' | 'adaptation' | 'user' | null;

  /** Event payload (JSONB) */
  payload: AuditPayload;

  /** IP address of the request (if applicable) */
  ipAddress: string | null;

  /** User agent string (if applicable) */
  userAgent: string | null;

  /** Immutable timestamp */
  createdAt: Date;
}

/**
 * Payload structure for audit events.
 */
export interface AuditPayload {
  /** Human-readable description of what happened */
  description: string;

  /** Previous state (for state changes) */
  previousState?: Record<string, unknown>;

  /** New state (for state changes) */
  newState?: Record<string, unknown>;

  /** Additional context-specific data */
  metadata?: Record<string, unknown>;

  /** Index signature for JSON compatibility */
  [key: string]: unknown;
}

// ============================================
// Input Types for Audit Service
// ============================================

/**
 * Input for creating an adaptation audit record.
 */
export interface CreateAdaptationAuditInput {
  eventType: AdaptationAuditEventType;
  userId: string;
  adaptationId?: string;
  goalId: string;
  payload: AuditPayload;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Input for creating a harm audit record.
 */
export interface CreateHarmAuditInput {
  eventType: HarmAuditEventType;
  userId: string;
  goalId?: string;
  payload: AuditPayload;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Input for creating a goal audit record.
 */
export interface CreateGoalAuditInput {
  eventType: GoalAuditEventType;
  userId: string;
  goalId: string;
  payload: AuditPayload;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generic input for creating any audit record.
 */
export interface CreateAuditRecordInput {
  category: AuditEventCategory;
  eventType: AuditEventType;
  userId: string | null;
  entityId: string | null;
  entityType: 'goal' | 'task' | 'adaptation' | 'user' | null;
  payload: AuditPayload;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ============================================
// Query Types
// ============================================

/**
 * Options for querying audit records.
 */
export interface QueryAuditRecordsOptions {
  /** Filter by user ID */
  userId?: string;

  /** Filter by category */
  category?: AuditEventCategory;

  /** Filter by event type */
  eventType?: AuditEventType;

  /** Filter by entity ID */
  entityId?: string;

  /** Filter by date range start */
  fromDate?: Date;

  /** Filter by date range end */
  toDate?: Date;

  /** Pagination limit */
  limit?: number;

  /** Pagination offset */
  offset?: number;
}

/**
 * Result of querying audit records.
 */
export interface AuditRecordsResult {
  records: AuditRecord[];
  total: number;
  hasMore: boolean;
}
