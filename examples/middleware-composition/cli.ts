import { cli } from 'cli-forge';

import { authMiddleware } from './middleware/auth';
import { timingMiddleware, getElapsedMs } from './middleware/timing';

const app = cli('middleware-demo')
  .command('greet', {
    builder: (cmd) =>
      cmd
        .option('name', {
          type: 'string',
          description: 'Name to greet',
          required: true,
        })
        // Middleware is applied in order. Each one adds to the args type.
        .middleware(timingMiddleware)
        .middleware(authMiddleware),

    handler: (args) => {
      // TypeScript knows args has: name, startTime, requestId, user, authenticated
      console.log(`[${args.requestId}] Hello, ${args.name}!`);
      console.log(`  Authenticated as: ${args.user.name} (${args.user.role})`);
      console.log(`  authenticated: ${args.authenticated}`);
      console.log(`  Request completed in ${getElapsedMs(args.startTime)}ms`);
    },
  });

export default app;

if (require.main === module) {
  app.forge();
}
