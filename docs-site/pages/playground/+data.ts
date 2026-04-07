import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { PageContextServer } from 'vike/types';
import type { SiteExample } from '../../server/utils/examples.js';
import { workspaceRoot } from '../../server/utils/workspace.js';

function readDtsFiles(
  dir: string,
  base: string
): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = [];
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readDtsFiles(fullPath, base));
    } else if (
      entry.name.endsWith('.d.mts') ||
      entry.name.endsWith('.d.cts')
    ) {
      results.push({
        path: relative(base, fullPath).replace(/\\/g, '/'),
        content: readFileSync(fullPath, 'utf-8'),
      });
    }
  }
  return results;
}

/**
 * Minimal example shape sent to the playground client.
 * Only includes the fields needed to populate the editor.
 */
export interface PlaygroundExample {
  id: string;
  title: string;
  description: string;
  files: { path: string; content: string }[];
  commands: { name: string; args: string; env?: Record<string, string> }[];
}

export interface TypeDeclarationFile {
  path: string;
  content: string;
}

export interface PlaygroundData {
  examples: Record<string, PlaygroundExample>;
  typeDeclarations: {
    cliForge: TypeDeclarationFile[];
    parser: TypeDeclarationFile[];
  };
}

function extractArgs(commandStr: string): string {
  // Commands look like: npx tsx ... <file>.ts <args>
  // or: {filename} <args>
  // Extract just the CLI args after the .ts/.js file
  const match = commandStr.match(/\.(?:ts|js)\s+(.*)/);
  if (match) return match[1];
  // If it starts with {filename}, strip that
  const fmatch = commandStr.match(/\{filename\}\s*(.*)/);
  if (fmatch) return fmatch[1];
  return commandStr;
}

function extractCommands(
  metadata: Record<string, unknown>
): PlaygroundExample['commands'] {
  const tests = metadata.test;
  if (!Array.isArray(tests)) return [];
  return tests
    .filter((t: any) => t?.options?.command)
    .map((t: any) => ({
      name: t.name ?? 'Run',
      args: extractArgs(t.options.command),
      env: t.options?.env as Record<string, string> | undefined,
    }));
}

function toPlaygroundExample(ex: SiteExample): PlaygroundExample {
  return {
    id: ex.id,
    title: ex.title,
    description: ex.description,
    files: ex.files
      .filter(
        (f) =>
          f.relativePath !== 'package.json' &&
          f.relativePath.toLowerCase() !== 'readme.md' &&
          !f.relativePath.toLowerCase().endsWith('content.md')
      )
      .map((f) => ({
        path: f.relativePath,
        content: f.content,
      })),
    commands: extractCommands(ex.metadata),
  };
}

export function data(pageContext: PageContextServer): PlaygroundData {
  const examples: Record<string, PlaygroundExample> = {};
  const siteExamples = pageContext.globalContext.examples as Record<
    string,
    SiteExample
  >;

  for (const [id, ex] of Object.entries(siteExamples)) {
    examples[id] = toPlaygroundExample(ex);
  }

  const root = workspaceRoot();
  const cliForgeDistDir = join(root, 'packages/cli-forge/dist');
  const parserDistDir = join(root, 'packages/parser/dist');

  return {
    examples,
    typeDeclarations: {
      cliForge: readDtsFiles(cliForgeDistDir, cliForgeDistDir),
      parser: readDtsFiles(parserDistDir, parserDistDir),
    },
  };
}
