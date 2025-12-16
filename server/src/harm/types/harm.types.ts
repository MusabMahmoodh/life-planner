/**
 * Harm Detection Types
 *
 * @see BACKEND SPECIFICATION Section 11 - Failure Handling (Product Safety)
 *
 * Harm Signals:
 * - User marks ≥5 tasks "unrealistic"
 * - Consistency drops ≥30% post-adaptation
 * - User messages "overwhelmed / quitting"
 *
 * Backend Response:
 * - Force difficulty reduction
 * - Disable auto-adaptation temporarily
 * - Log incident
 * - Require user confirmation to proceed
 */

// ============================================
// Harm Signal Types
// ============================================

/**
 * Types of harm signals the system can detect.
 *
 * @see BACKEND SPECIFICATION Section 11 - Harm Signals
 */
export enum HarmSignalType {
  /** User marked ≥5 tasks as "unrealistic" */
  UNREALISTIC_TASKS = 'unrealistic_tasks',

  /** Consistency dropped ≥30% after an adaptation */
  CONSISTENCY_DROP = 'consistency_drop',

  /** User expressed overwhelmed/quitting signals */
  USER_DISTRESS = 'user_distress',
}

/**
 * Severity levels for harm signals.
 */
export enum HarmSeverity {
  /** Warning level - requires attention */
  WARNING = 'warning',

  /** Critical level - immediate action required */
  CRITICAL = 'critical',

  /** Emergency level - all adaptations halted */
  EMERGENCY = 'emergency',
}

/**
 * A detected harm signal with metadata.
 */
export interface HarmSignal {
  /** Type of harm signal */
  type: HarmSignalType;

  /** Severity level */
  severity: HarmSeverity;

  /** Human-readable description */
  message: string;

  /** When the signal was detected */
  detectedAt: Date;

  /** Additional context data */
  metadata: HarmSignalMetadata;
}

/**
 * Metadata for different harm signal types.
 */
export interface HarmSignalMetadata {
  /** For UNREALISTIC_TASKS: count of tasks marked unrealistic */
  unrealisticTaskCount?: number;

  /** For CONSISTENCY_DROP: percentage drop */
  consistencyDropPercent?: number;

  /** For CONSISTENCY_DROP: consistency before adaptation */
  previousConsistency?: number;

  /** For CONSISTENCY_DROP: consistency after adaptation */
  currentConsistency?: number;

  /** For CONSISTENCY_DROP: the adaptation that caused the drop */
  relatedAdaptationId?: string;

  /** For USER_DISTRESS: detected keywords */
  distressKeywords?: string[];

  /** For USER_DISTRESS: the source message/feedback */
  sourceMessage?: string;

  /** Generic additional data */
  [key: string]: unknown;
}

// ============================================
// Harm Incident Types
// ============================================

/**
 * Status of a harm incident.
 */
export enum HarmIncidentStatus {
  /** Incident detected, awaiting resolution */
  ACTIVE = 'active',

  /** User confirmed to proceed */
  USER_CONFIRMED = 'user_confirmed',

  /** System resolved the incident */
  RESOLVED = 'resolved',

  /** Incident expired without action */
  EXPIRED = 'expired',
}

/**
 * Actions taken by the system in response to harm.
 */
export interface HarmResponseActions {
  /** Whether difficulty was forcibly reduced */
  difficultyReduced: boolean;

  /** New difficulty level if reduced */
  newDifficultyLevel?: string;

  /** Whether auto-adaptation was disabled */
  autoAdaptationDisabled: boolean;

  /** When auto-adaptation will be re-enabled (null if permanent until user action) */
  autoAdaptationReenableAt?: Date | null;

  /** IDs of tasks that were simplified */
  simplifiedTaskIds: string[];

  /** Whether user confirmation is required to proceed */
  requiresUserConfirmation: boolean;
}

/**
 * A harm incident record.
 * Immutable once created (append-only updates via new records).
 */
export interface HarmIncident {
  /** Unique incident ID */
  id: string;

  /** User ID */
  userId: string;

  /** Related goal ID (if applicable) */
  goalId: string | null;

  /** The harm signal that triggered this incident */
  signal: HarmSignal;

  /** Actions taken by the system */
  responseActions: HarmResponseActions;

  /** Current status */
  status: HarmIncidentStatus;

  /** When the incident was created */
  createdAt: Date;

  /** When the incident was resolved (if applicable) */
  resolvedAt: Date | null;

  /** User confirmation notes (if user confirmed to proceed) */
  userConfirmationNotes: string | null;
}

// ============================================
// Harm Detection Input Types
// ============================================

/**
 * Input for detecting unrealistic tasks harm signal.
 */
export interface UnrealisticTasksInput {
  /** User ID */
  userId: string;

  /** Goal ID */
  goalId: string;

  /** Count of tasks marked as unrealistic */
  unrealisticTaskCount: number;

  /** IDs of tasks marked as unrealistic */
  unrealisticTaskIds: string[];
}

/**
 * Input for detecting consistency drop harm signal.
 */
export interface ConsistencyDropInput {
  /** User ID */
  userId: string;

  /** Goal ID */
  goalId: string;

  /** The adaptation that was applied */
  adaptationId: string;

  /** Consistency rate before adaptation (0-100) */
  previousConsistency: number;

  /** Consistency rate after adaptation (0-100) */
  currentConsistency: number;
}

/**
 * Input for detecting user distress harm signal.
 */
export interface UserDistressInput {
  /** User ID */
  userId: string;

  /** Goal ID (if related to specific goal) */
  goalId?: string;

  /** The user's message containing distress signals */
  message: string;

  /** Source of the message */
  source: 'feedback' | 'chat' | 'task_note' | 'support_request';
}

// ============================================
// Harm Detection Result Types
// ============================================

/**
 * Result of harm detection evaluation.
 */
export interface HarmDetectionResult {
  /** Whether harm was detected */
  harmDetected: boolean;

  /** Detected harm signals (empty if no harm) */
  signals: HarmSignal[];

  /** Actions that should be taken */
  requiredActions: RequiredHarmActions;

  /** Evaluation timestamp */
  evaluatedAt: Date;
}

/**
 * Actions required in response to detected harm.
 */
export interface RequiredHarmActions {
  /** Force difficulty reduction for all non-easy tasks */
  forceDifficultyReduction: boolean;

  /** Disable auto-adaptation */
  disableAutoAdaptation: boolean;

  /** Log incident to audit */
  logIncident: boolean;

  /** Require user confirmation before any further adaptations */
  requireUserConfirmation: boolean;

  /** Suggested new difficulty level */
  suggestedDifficultyLevel?: string;
}

// ============================================
// User Harm State Types
// ============================================

/**
 * User's current harm state.
 * Tracks whether auto-adaptation is disabled and why.
 */
export interface UserHarmState {
  /** User ID */
  userId: string;

  /** Whether auto-adaptation is currently disabled */
  autoAdaptationDisabled: boolean;

  /** When auto-adaptation was disabled */
  disabledAt: Date | null;

  /** The incident that caused auto-adaptation to be disabled */
  disablingIncidentId: string | null;

  /** Whether user confirmation is pending */
  pendingUserConfirmation: boolean;

  /** Active incidents for this user */
  activeIncidentIds: string[];

  /** Last updated timestamp */
  updatedAt: Date;
}

// ============================================
// Service Input Types
// ============================================

/**
 * Input for creating a harm incident.
 */
export interface CreateHarmIncidentInput {
  /** User ID */
  userId: string;

  /** Goal ID (if applicable) */
  goalId?: string;

  /** The harm signal */
  signal: HarmSignal;

  /** Actions taken */
  responseActions: HarmResponseActions;
}

/**
 * Input for resolving a harm incident.
 */
export interface ResolveHarmIncidentInput {
  /** Incident ID */
  incidentId: string;

  /** User ID (for ownership verification) */
  userId: string;

  /** Resolution status */
  status: HarmIncidentStatus.USER_CONFIRMED | HarmIncidentStatus.RESOLVED;

  /** User confirmation notes (if user confirmed) */
  confirmationNotes?: string;
}

/**
 * Input for force difficulty reduction.
 */
export interface ForceDifficultyReductionInput {
  /** User ID */
  userId: string;

  /** Goal ID */
  goalId: string;

  /** Target difficulty level (typically 'easy') */
  targetDifficulty: string;

  /** The incident causing the reduction */
  incidentId: string;
}

/**
 * Result of force difficulty reduction.
 */
export interface ForceDifficultyReductionResult {
  /** Whether reduction was successful */
  success: boolean;

  /** Number of tasks reduced */
  tasksReduced: number;

  /** IDs of tasks that were reduced */
  reducedTaskIds: string[];

  /** Error message if failed */
  error?: string;
}

// ============================================
// Constants
// ============================================

/**
 * Threshold for unrealistic tasks harm signal.
 * User marks ≥5 tasks "unrealistic" → triggers harm signal.
 *
 * @see BACKEND SPECIFICATION Section 11
 */
export const UNREALISTIC_TASKS_THRESHOLD = 5;

/**
 * Threshold for consistency drop harm signal.
 * Consistency drops ≥30% post-adaptation → triggers harm signal.
 *
 * @see BACKEND SPECIFICATION Section 11
 */
export const CONSISTENCY_DROP_THRESHOLD_PERCENT = 30;

/**
 * Distress keywords to detect in user messages.
 * Case-insensitive matching.
 *
 * @see BACKEND SPECIFICATION Section 11
 */
export const DISTRESS_KEYWORDS = [
  'overwhelmed',
  'quitting',
  'quit',
  'giving up',
  'give up',
  'too much',
  'too hard',
  'impossible',
  "can't do this",
  'cannot do this',
  'stressed',
  'anxiety',
  'anxious',
  'burning out',
  'burnout',
  'exhausted',
] as const;
