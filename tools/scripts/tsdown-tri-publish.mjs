import { dirname, resolve } from 'path';

/**
 * Shared tsdown config for tri-publish packages:
 * - Node/Bun compatible ESM + CJS builds
 * - Browser-compatible ESM build with module alias swaps
 */
export function createTriPublishConfig({
  browserAlias = {},
  browserEntry = { index: 'src/index.ts' },
  clean = true,
  entry,
  exclude = [],
  outDir = 'dist',
  root = 'src',
}) {
  return [
    {
      entry: [entry, ...exclude.map((pattern) => `!${pattern}`)],
      format: ['esm', 'cjs'],
      unbundle: true,
      root,
      outDir,
      dts: {
        build: true,
        cjsReexport: true,
      },
      sourcemap: true,
      clean,
      fixedExtension: true,
      platform: 'node',
      exports: false,
    },
    {
      entry: browserEntry,
      format: ['esm'],
      outDir: `${outDir}/browser`,
      dts: false,
      sourcemap: true,
      platform: 'browser',
      exports: false,
      plugins: [createBrowserAliasPlugin(browserAlias)],
    },
  ];
}

function createBrowserAliasPlugin(aliases) {
  const aliasEntries = Object.entries(aliases).map(([from, to]) => ({
    from,
    to,
  }));

  return {
    name: 'browser-alias-plugin',
    resolveId(source, importer) {
      if (!importer) return null;

      const match = aliasEntries.find(({ from }) => isAliasMatch(source, from));

      if (!match) {
        return null;
      }

      return resolveAliasTarget(importer, match.to);
    },
  };
}

function isAliasMatch(source, from) {
  return (
    source === from ||
    source === `./${from}` ||
    source.endsWith(`/${from}`) ||
    source.endsWith(`/${from}.js`) ||
    source.endsWith(`/${from}.mjs`) ||
    source.endsWith(`/${from}.ts`)
  );
}

function resolveAliasTarget(importer, target) {
  if (target.startsWith('.') || target.startsWith('/')) {
    return resolve(dirname(importer), target);
  }

  return target;
}
