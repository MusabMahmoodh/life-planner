import { z } from 'zod';

/**
 * Environment variable schema using Zod for strict validation.
 * All required env vars must be present at startup.
 */
export const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database (Supabase PostgreSQL)
  DATABASE_URL: z.string().url().startsWith('postgresql://'),

  // Supabase Auth
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1).startsWith('sk-'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables at startup.
 * Throws descriptive error if validation fails.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err: z.ZodIssue) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return result.data;
}
