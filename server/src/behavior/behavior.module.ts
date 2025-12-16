import { Module } from '@nestjs/common';
import { BehavioralEngineService } from './behavioral-engine.service';

/**
 * BehaviorModule provides behavioral analysis capabilities.
 *
 * @see BACKEND SPECIFICATION Section 6 - Behavioral Engine
 *
 * This module exports:
 * - BehavioralEngineService for evaluating user behavior
 * - Pure functions for deterministic calculations
 */
@Module({
  providers: [BehavioralEngineService],
  exports: [BehavioralEngineService],
})
export class BehaviorModule {}
