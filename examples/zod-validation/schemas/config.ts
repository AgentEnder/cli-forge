import { z } from 'zod';

/**
 * Valid deployment environments.
 */
export const environments = ['development', 'staging', 'production'] as const;

/**
 * Deployment configuration schema.
 * Validates and transforms deployment options.
 */
export const deployConfigSchema = z
  .object({
    env: z.enum(environments),
    replicas: z.number().min(1).max(10),
    dryRun: z.boolean().optional(),
  })
  .transform((config) => ({
    ...config,
    // Add computed properties based on environment
    requiresApproval: config.env === 'production',
    defaultTimeout: config.env === 'production' ? 300 : 60,
  }));

/**
 * Type inferred from the schema output (after transform).
 */
export type DeployConfig = z.output<typeof deployConfigSchema>;
