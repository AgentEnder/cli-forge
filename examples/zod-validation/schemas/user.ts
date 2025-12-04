import { z } from 'zod';

/**
 * User roles with their permission levels.
 */
export const roles = ['viewer', 'editor', 'admin'] as const;
export type Role = (typeof roles)[number];

/**
 * User data schema with validation and normalization.
 */
export const userSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    role: z.enum(roles),
    name: z.string().optional(),
  })
  .transform((user) => ({
    ...user,
    // Normalize email to lowercase
    email: user.email.toLowerCase(),
    // Compute permission flags based on role
    canEdit: user.role === 'editor' || user.role === 'admin',
    canAdmin: user.role === 'admin',
  }));

/**
 * Type inferred from the schema output.
 */
export type User = z.output<typeof userSchema>;
