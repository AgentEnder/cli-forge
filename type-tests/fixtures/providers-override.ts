/**
 * Tests child-shadows-parent provider override semantics:
 * - When a child command re-provides a key that exists on its parent, the
 *   child's type must shadow the parent's (not intersect with it).
 * - Parent-only providers must still be visible from child contexts.
 */
import { cli } from 'cli-forge';
import { getCommandContext } from 'cli-forge/context';

export const app = cli('app')
  .provide('db', { kind: 'parent' as const, parentOnly: 1 })
  .provide('rootOnly', { root: true as const })
  .command('build', {
    builder: (cmd) =>
      cmd.provide('db', { kind: 'child' as const, childOnly: 'x' }),
    handler: () => handleBuild(),
  });

function handleBuild() {
  const ctx = getCommandContext(app);
  const buildCtx = ctx.getChildContext('build');

  const db = buildCtx.inject('db');

  // Child override must win — this assignment proves `db` is the child shape,
  // not the parent's `{ kind: 'parent'; parentOnly: number }`.
  const _childShape: { kind: 'child'; childOnly: string } = db;
  void _childShape;

  // The parent-only provider must still be reachable from the child context.
  const rootOnly = buildCtx.inject('rootOnly');
  const _rootShape: { root: true } = rootOnly;
  void _rootShape;
}
