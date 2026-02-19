// ---
// id: execution-lifecycle
// title: Execution Lifecycle
// description: |
//   Demonstrates the full execution lifecycle of a cli-forge CLI, including
//   the order in which builders, parsing, middleware, init hooks, validation,
//   coerce, defaults, conflicts, implies, and handlers execute.
//
//   When `forge()` is called, execution proceeds in two phases:
//
//   **Phase 1 — Discovery loop** (per command level):
//   builder → parse (best-effort) → merge → middleware → init hooks → find next subcommand → repeat
//
//   **Phase 2 — Final parse + execution:**
//   parse (with validation) → help/version check → handler
//
//   This example uses `--format json` with the `deploy` subcommand to walk
//   through every stage. The console output shows the exact order.
// test:
//   - name: "Demonstrates execution lifecycle order"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json execution-lifecycle.ts --format json deploy --target staging'
//     assertions:
//       stdout:
//         matches: '\[1\. root builder\].*\[2\. root middleware\].*\[3\. root init hook\].*\[4\. deploy builder\].*\[5\. deploy middleware\].*\[6\. deploy init hook\].*\[7\. handler\]'
// ---
import cli from 'cli-forge';

const app = cli('lifecycle', {
  builder: (argv) => {
    // Phase 1, step 1 — The root builder runs first. In this example,
    // the root options are registered inline (above) rather than in a
    // builder callback, but the effect is the same. The builder is where
    // options, middleware, init hooks, and subcommands are registered.
    console.log('[1. root builder]');

    // ──────────────────────────────────────────────────────────
    // ROOT LEVEL — options, middleware, init hook
    // ──────────────────────────────────────────────────────────

    return (
      argv
        .option('format', {
          type: 'string',
          description: 'Output format',
          // Default: applied during normalization (before validation)
          default: 'text',
          // Coerce: runs after the value is parsed, transforms the raw value
          coerce: (v: string) => v.toLowerCase(),
        })

        .option('verbose', {
          type: 'boolean',
          description: 'Enable verbose output',
          default: false,
        })

        // Phase 1, step 3 — Middleware runs BEFORE init hooks at each command
        // level. This lets init hooks depend on middleware-computed values.
        .middleware((args) => {
          console.log('[2. root middleware] format =', args.format);
          return {
            ...args,
            // Middleware can add derived values that later stages can use
            isJson: args.format === 'json',
          };
        })

        // Phase 1, step 4 — Init hooks run after middleware, with access to
        // middleware-transformed args. They can dynamically register commands.
        .init((app, args) => {
          console.log(
            '[3. root init hook] isJson =',
            args.isJson,
            '(set by middleware)'
          );

          // Dynamically register the "deploy" command based on parsed args.
          // In real CLIs this is useful for plugin loading: read a config,
          // then register commands based on what plugins are configured.
          app.command('deploy', {
            // Phase 1 (next iteration) step 1 — Subcommand builder runs
            // lazily when "deploy" is discovered in unmatched tokens.
            builder: (cmd) => {
              console.log('[4. deploy builder]');
              return (
                cmd
                  .option('target', {
                    type: 'string',
                    description: 'Deployment target',
                    required: true,
                  })
                  .option('dry-run', {
                    type: 'boolean',
                    description: 'Simulate without making changes',
                  })
                  .option('force', {
                    type: 'boolean',
                    description: 'Skip safety checks',
                  })
                  .option('backup-path', {
                    type: 'string',
                    description:
                      'Backup location (required when --force is used)',
                  })
                  // Conflicts: --dry-run and --force are mutually exclusive
                  // (validated during Phase 2 final parse)
                  .conflicts('dry-run', 'force')
                  // Implies: --force requires --backup-path
                  // (validated during Phase 2 final parse)
                  .implies('force', 'backup-path')
                  // Subcommand-level middleware runs in Phase 1 for this level,
                  // before the subcommand's init hooks.
                  .middleware((a) => {
                    console.log('[5. deploy middleware] target =', a.target);
                    return a;
                  })
                  // Subcommand-level init hook
                  .init((subcli, a) => {
                    console.log('[6. deploy init hook] verbose =', a.verbose);
                    // Could register nested subcommands here, modify options, or other stuff.
                    // Most typically not needed for registering commands or options, but could
                    // make sense in some cases (e.g. options that's registration depends on another
                    // option flag. Things like a --config path that includes plugins which register
                    // commands are one of the very few cases that it would make sense.)
                  })
              );
            },

            // Phase 2 step 3 — Handler runs after final validation passes.
            // At this point all options have been through:
            // defaults → env → config → coerce → required → choices →
            // conflicts → implies → custom validate
            handler: (args) => {
              console.log('[7. handler] deploying to', args.target);
              if (args.verbose) {
                console.log('  format:', args.format);
                console.log('  dry-run:', args['dry-run']);
              }
            },
          });
        })
    );
  },
});

export default cli;

if (require.main === module) {
  (async () => {
    await app.forge();
  })();
}
