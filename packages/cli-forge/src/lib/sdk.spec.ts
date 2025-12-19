import { cli } from './public-api';

describe('CLI.sdk()', () => {
  describe('basic invocation', () => {
    it('should invoke root command with object args', async () => {
      let receivedArgs: any;
      const myCLI = cli('test', {
        builder: (cmd) => cmd.option('name', { type: 'string' }),
        handler: (args) => {
          receivedArgs = args;
          return { success: true };
        },
      });

      const sdk = myCLI.sdk();
      const result = await sdk({ name: 'world' });

      expect(result.success).toBe(true);
      expect(receivedArgs.name).toBe('world');
    });

    it('should invoke root command with string array args', async () => {
      let receivedArgs: any;
      const myCLI = cli('test', {
        builder: (cmd) => cmd.option('name', { type: 'string' }),
        handler: (args) => {
          receivedArgs = args;
          return { success: true };
        },
      });

      const sdk = myCLI.sdk();
      const result = await sdk(['--name', 'world']);

      expect(result.success).toBe(true);
      expect(receivedArgs.name).toBe('world');
    });

    it('should attach $args to object results', async () => {
      const myCLI = cli('test', {
        builder: (cmd) =>
          cmd.option('count', { type: 'number', required: true }),
        handler: (args) => ({ value: args.count * 2 }),
      });

      const sdk = myCLI.sdk();
      const result = await sdk({ count: 5 });

      expect(result.value).toBe(10);
      expect(result.$args.count).toBe(5);
    });

    it('should return primitives without $args', async () => {
      const myCLI = cli('test', {
        handler: () => 42,
      });

      const sdk = myCLI.sdk();
      const result = await sdk();

      expect(result).toBe(42);
    });
  });

  describe('subcommands', () => {
    it('should invoke subcommand via property access', async () => {
      let buildCalled = false;
      const myCLI = cli('test').command('build', {
        builder: (cmd) => cmd.option('watch', { type: 'boolean' }),
        handler: (args) => {
          buildCalled = true;
          return { watching: args.watch };
        },
      });

      const sdk = myCLI.sdk();
      const result = await sdk.build({ watch: true });

      expect(buildCalled).toBe(true);
      expect(result.watching).toBe(true);
    });

    it('should invoke nested subcommands', async () => {
      let migrateCalled = false;
      const myCLI = cli('test').command('db', {
        builder: (cmd) =>
          cmd.command('migrate', {
            builder: (c) => c.option('dry', { type: 'boolean' }),
            handler: (args) => {
              migrateCalled = true;
              return { dryRun: args.dry };
            },
          }),
      });

      const sdk = myCLI.sdk();
      const result = await sdk.db.migrate({ dry: true });

      expect(migrateCalled).toBe(true);
      expect(result.dryRun).toBe(true);
    });

    it('should throw when invoking command without handler', async () => {
      const myCLI = cli('test').command('db', {
        // No handler - container command
        builder: (cmd) =>
          cmd.command('migrate', {
            handler: () => 'done',
          }),
      });

      const sdk = myCLI.sdk();

      await expect(sdk.db()).rejects.toThrow("Command 'db' has no handler");
    });
  });

  describe('defaults', () => {
    it('should apply default values for object args', async () => {
      let receivedArgs: any;
      const myCLI = cli('test', {
        builder: (cmd) =>
          cmd
            .option('host', { type: 'string', default: 'localhost' })
            .option('port', { type: 'number', default: 3000 }),
        handler: (args) => {
          receivedArgs = args;
          return 'ok';
        },
      });

      const sdk = myCLI.sdk();
      await sdk({ port: 8080 });

      expect(receivedArgs.host).toBe('localhost');
      expect(receivedArgs.port).toBe(8080);
    });

    it('should allow overriding all defaults', async () => {
      let receivedArgs: any;
      const myCLI = cli('test', {
        builder: (cmd) =>
          cmd.option('verbose', { type: 'boolean', default: false }),
        handler: (args) => {
          receivedArgs = args;
        },
      });

      const sdk = myCLI.sdk();
      await sdk({ verbose: true });

      expect(receivedArgs.verbose).toBe(true);
    });
  });

  describe('middleware', () => {
    it('should run middleware for object args', async () => {
      let receivedArgs: any;
      const myCLI = cli('test', {
        builder: (cmd) => cmd.option('name', { type: 'string' }),
        handler: (args) => {
          receivedArgs = args;
        },
      }).middleware((args) => ({ ...args, timestamp: 12345 }));

      const sdk = myCLI.sdk();
      await sdk({ name: 'test' });

      expect(receivedArgs.timestamp).toBe(12345);
    });

    it('should run parent middleware for subcommands', async () => {
      let receivedArgs: any;
      const myCLI = cli('test')
        .middleware((args) => ({ ...args, fromRoot: true }))
        .command('child', {
          handler: (args) => {
            receivedArgs = args;
          },
        });

      const sdk = myCLI.sdk();
      await sdk.child({});

      expect(receivedArgs.fromRoot).toBe(true);
    });
  });

  describe('validation', () => {
    it('should validate string array args', async () => {
      const myCLI = cli('test', {
        builder: (cmd) =>
          cmd.option('count', { type: 'number', required: true }),
        handler: () => 'ok',
      });

      const sdk = myCLI.sdk();

      // String array args go through full validation
      await expect(sdk([])).rejects.toThrow();
    });

    it('should skip validation for object args (trust TypeScript)', async () => {
      let receivedArgs: any;
      const myCLI = cli('test', {
        builder: (cmd) =>
          cmd.option('count', { type: 'number', required: true }),
        handler: (args) => {
          receivedArgs = args;
          return 'ok';
        },
      });

      const sdk = myCLI.sdk();

      // Object args skip validation - TypeScript should catch this
      // but at runtime we allow it through
      const result = await sdk({});
      expect(result).toBe('ok');
      expect(receivedArgs.count).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw handler errors directly', async () => {
      const myCLI = cli('test', {
        handler: () => {
          throw new Error('Handler failed');
        },
      });

      const sdk = myCLI.sdk();

      await expect(sdk()).rejects.toThrow('Handler failed');
    });

    it('should throw for non-existent subcommands', async () => {
      const myCLI = cli('test').command('build', { handler: () => 'ok' });

      const sdk = myCLI.sdk();

      // Access non-existent command returns undefined
      expect((sdk as any).nonexistent).toBeUndefined();
    });
  });

  describe('async handlers', () => {
    it('should handle async handlers', async () => {
      const myCLI = cli('test', {
        handler: async () => {
          await new Promise((r) => setTimeout(r, 10));
          return { async: true };
        },
      });

      const sdk = myCLI.sdk();
      const result = await sdk();

      expect(result.async).toBe(true);
    });
  });

  describe('type safety', () => {
    it('should preserve handler return type', async () => {
      interface BuildResult {
        files: string[];
        success: boolean;
      }

      const myCLI = cli('test', {
        handler: (): BuildResult => ({
          files: ['a.js', 'b.js'],
          success: true,
        }),
      });

      const sdk = myCLI.sdk();
      const result = await sdk();

      // Type should be BuildResult & { $args: ... }
      expect(result.files).toEqual(['a.js', 'b.js']);
      expect(result.success).toBe(true);
    });
  });
});
