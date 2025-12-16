/**
 * AI Module
 *
 * @see BACKEND SPECIFICATION Section 7 - AI Integration Rules
 *
 * This module provides the AI Gateway service for the application.
 * The AIGatewayService is the ONLY place where OpenAI API is called.
 *
 * ARCHITECTURE:
 * - AIGatewayService: Calls OpenAI, validates outputs, returns proposals
 * - No database access
 * - No state mutation
 * - No business logic
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AIGatewayService } from './ai-gateway.service';
import { AI_GATEWAY_SERVICE } from './types/ai-gateway.types';

@Module({
  imports: [ConfigModule],
  providers: [
    AIGatewayService,
    {
      provide: AI_GATEWAY_SERVICE,
      useExisting: AIGatewayService,
    },
  ],
  exports: [AIGatewayService, AI_GATEWAY_SERVICE],
})
export class AIModule {}
