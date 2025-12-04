/**
 * Tests that middleware chain correctly accumulates types.
 */
import { cli } from 'cli-forge';

interface User {
  id: string;
  name: string;
}

interface AuthContext {
  user: User;
  authenticated: boolean;
}

interface TimingContext {
  startTime: number;
  requestId: string;
}

function authMiddleware<T>(args: T): T & AuthContext {
  return {
    ...args,
    user: { id: '123', name: 'Test' },
    authenticated: true,
  };
}

function timingMiddleware<T>(args: T): T & TimingContext {
  return {
    ...args,
    startTime: Date.now(),
    requestId: 'req-123',
  };
}

const app = cli('test')
  .option('verbose', { type: 'boolean', default: false })
  .middleware(timingMiddleware)
  .middleware(authMiddleware)
  .command('action', {
    handler: (args) => {
      // Should have all accumulated properties
      const verbose: boolean = args.verbose;
      const startTime: number = args.startTime;
      const requestId: string = args.requestId;
      const user: User = args.user;
      const authenticated: boolean = args.authenticated;

      console.log(verbose, startTime, requestId, user.name, authenticated);
    },
  });

export { app };
