/**
 * Tests that middleware correctly adds properties to args type.
 */
import { cli } from 'cli-forge';

interface TimingContext {
  startTime: number;
}

function timingMiddleware<T>(args: T): T & TimingContext {
  return {
    ...args,
    startTime: Date.now(),
  };
}

const app = cli('test')
  .option('name', { type: 'string', required: true })
  .middleware(timingMiddleware)
  .command('greet', {
    handler: (args) => {
      // args should have both name and startTime
      const name: string = args.name;
      const startTime: number = args.startTime;
      console.log(name, startTime);
    },
  });

export { app };
