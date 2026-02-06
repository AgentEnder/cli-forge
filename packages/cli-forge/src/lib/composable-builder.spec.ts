import { describe, it, expect } from 'vitest';
import { makeComposableBuilder } from './composable-builder';
import cli from './public-api';
import { chain } from '@cli-forge/parser';

describe('makeComposableBuilder', () => {
  describe('capture-and-replay', () => {
    it('should produce stable middleware references across applications', () => {
      const builder = makeComposableBuilder((cmd) =>
        cmd
          .option('verbose', { type: 'boolean' })
          .middleware((args: any) => args)
      );

      const cli1 = builder(cli('test1'));
      const cli2 = builder(cli('test2'));

      const mw1 = [...(cli1 as any).registeredMiddleware];
      const mw2 = [...(cli2 as any).registeredMiddleware];
      expect(mw1.length).toBe(1);
      expect(mw2.length).toBe(1);
      expect(mw1[0]).toBe(mw2[0]);
    });

    it('should correctly replay option registrations', async () => {
      const builder = makeComposableBuilder((cmd) =>
        cmd.option('verbose', { type: 'boolean' })
      );

      let handlerArgs: any;
      await chain(cli('test'), builder)
        .command('$0', {
          handler: (args) => {
            handlerArgs = args;
          },
        })
        .forge(['--verbose']);
      expect(handlerArgs.verbose).toBe(true);
    });

    it('should deduplicate middleware when builder applied to parent and child', async () => {
      let mwCallCount = 0;
      const builder = makeComposableBuilder((cmd) =>
        cmd.option('verbose', { type: 'boolean' }).middleware((args: any) => {
          mwCallCount++;
          return args;
        })
      );

      await chain(cli('parent'), builder)
        .command('child', {
          builder: (cmd) =>
            chain(cmd, builder).option('format', { type: 'string' }),
          handler: () => {},
        })
        .forge(['child']);
      expect(mwCallCount).toBe(1);
    });

    it('should replay commands registered by the builder', () => {
      const builder = makeComposableBuilder((cmd) =>
        cmd.command('sub', {
          builder: (c) => c.option('flag', { type: 'boolean' }),
          handler: () => {},
        })
      );

      const myCli = builder(cli('test'));
      const children = myCli.getChildren();
      expect(children).toHaveProperty('sub');
    });
  });
});
