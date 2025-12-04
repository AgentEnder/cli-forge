/**
 * Represents an authenticated user in the system.
 */
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

/**
 * Context added by the auth middleware.
 */
export interface AuthContext {
  user: User;
  authenticated: boolean;
}

/**
 * Context added by the timing middleware.
 */
export interface TimingContext {
  startTime: number;
  requestId: string;
}
