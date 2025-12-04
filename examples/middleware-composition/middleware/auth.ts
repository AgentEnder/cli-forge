import type { AuthContext, User } from '../types';

/**
 * Simulates looking up a user. In a real application, this might
 * query a database or validate a token.
 */
function lookupUser(): User {
  return {
    id: 'user-123',
    name: 'Jane Developer',
    role: 'admin',
  };
}

/**
 * Authentication middleware that adds user context to the args.
 *
 * This middleware demonstrates how to add typed properties that
 * downstream middleware and handlers can rely on.
 */
export function authMiddleware<T>(args: T): T & AuthContext {
  const user = lookupUser();

  return {
    ...args,
    user,
    authenticated: true,
  };
}
