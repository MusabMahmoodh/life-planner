/**
 * Domain error codes for structured error responses.
 * Maps to HTTP status codes: 400 (Bad Request), 403 (Forbidden), 409 (Conflict)
 *
 * @see LLM INPUT CONTRACT Section 11 - Validation & Error Handling
 */
export enum DomainErrorCode {
  // ============================================
  // 400 - Bad Request (Validation Errors)
  // ============================================
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_TASK_STATUS_TRANSITION = 'INVALID_TASK_STATUS_TRANSITION',
  INVALID_GOAL_STATUS_TRANSITION = 'INVALID_GOAL_STATUS_TRANSITION',
  INVALID_DIFFICULTY_CHANGE = 'INVALID_DIFFICULTY_CHANGE',
  INVALID_ADAPTATION_TYPE = 'INVALID_ADAPTATION_TYPE',
  TASK_ALREADY_COMPLETED = 'TASK_ALREADY_COMPLETED',
  AI_VALIDATION_FAILED = 'AI_VALIDATION_FAILED',

  // ============================================
  // 403 - Forbidden (Authorization Errors)
  // ============================================
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN_RESOURCE = 'FORBIDDEN_RESOURCE',
  GOAL_NOT_OWNED = 'GOAL_NOT_OWNED',
  TASK_NOT_OWNED = 'TASK_NOT_OWNED',
  ADAPTATION_NOT_OWNED = 'ADAPTATION_NOT_OWNED',

  // ============================================
  // 404 - Not Found
  // ============================================
  GOAL_NOT_FOUND = 'GOAL_NOT_FOUND',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  ADAPTATION_NOT_FOUND = 'ADAPTATION_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // ============================================
  // 409 - Conflict (Business Rule Violations)
  // ============================================
  ADAPTATION_ALREADY_PROCESSED = 'ADAPTATION_ALREADY_PROCESSED',
  ADAPTATION_BLOCKED = 'ADAPTATION_BLOCKED',
  ROLLBACK_WINDOW_EXPIRED = 'ROLLBACK_WINDOW_EXPIRED',
  GOAL_ARCHIVED = 'GOAL_ARCHIVED',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',

  // ============================================
  // 500 - Internal Errors
  // ============================================
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Maps domain error codes to HTTP status codes.
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<DomainErrorCode, number> = {
  // 400 - Bad Request
  [DomainErrorCode.INVALID_INPUT]: 400,
  [DomainErrorCode.INVALID_TASK_STATUS_TRANSITION]: 400,
  [DomainErrorCode.INVALID_GOAL_STATUS_TRANSITION]: 400,
  [DomainErrorCode.INVALID_DIFFICULTY_CHANGE]: 400,
  [DomainErrorCode.INVALID_ADAPTATION_TYPE]: 400,
  [DomainErrorCode.TASK_ALREADY_COMPLETED]: 400,
  [DomainErrorCode.AI_VALIDATION_FAILED]: 400,

  // 403 - Forbidden
  [DomainErrorCode.UNAUTHORIZED]: 403,
  [DomainErrorCode.FORBIDDEN_RESOURCE]: 403,
  [DomainErrorCode.GOAL_NOT_OWNED]: 403,
  [DomainErrorCode.TASK_NOT_OWNED]: 403,
  [DomainErrorCode.ADAPTATION_NOT_OWNED]: 403,

  // 404 - Not Found
  [DomainErrorCode.GOAL_NOT_FOUND]: 404,
  [DomainErrorCode.TASK_NOT_FOUND]: 404,
  [DomainErrorCode.ADAPTATION_NOT_FOUND]: 404,
  [DomainErrorCode.USER_NOT_FOUND]: 404,

  // 409 - Conflict
  [DomainErrorCode.ADAPTATION_ALREADY_PROCESSED]: 409,
  [DomainErrorCode.ADAPTATION_BLOCKED]: 409,
  [DomainErrorCode.ROLLBACK_WINDOW_EXPIRED]: 409,
  [DomainErrorCode.GOAL_ARCHIVED]: 409,
  [DomainErrorCode.CONCURRENT_MODIFICATION]: 409,

  // 500 - Internal Server Error
  [DomainErrorCode.AI_SERVICE_UNAVAILABLE]: 503,
  [DomainErrorCode.DATABASE_ERROR]: 500,
  [DomainErrorCode.INTERNAL_ERROR]: 500,
};
