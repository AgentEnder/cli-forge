import { Dirent, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { normalize } from 'node:path/posix';

import { parse as loadYaml } from 'yaml';

export type CommandConfiguration = {
  title?: string;
  description?: string;
  command: string;
  env: Record<string, string>;
  assertions?: Array<{ contains?: string }>;
};

export type FrontMatter = {
  id: string;
  title: string;
  description?: string;
  fileMap: Record<string, string>;
  commands: (string | CommandConfiguration)[];
  entryPoint: string;
};

export type Example = {
  files: {
    path: string;
    contents: string;
  }[];
  data: FrontMatter;
};

function normalizeFrontMatter(
  root: string,
  example: Omit<Example, 'data'> & {
    data: Partial<FrontMatter>;
  }
): ReturnType<typeof collectExamples>[number] {
  const { data, files } = example;
  const defaultName = basename(files[0].path).replace('.ts', '');

  if (files.length === 0) {
    throw new Error(
      'Example must have at least one file... ' + JSON.stringify(example.data)
    );
  } else if (files.length > 1 && !data.entryPoint) {
    throw new Error(
      'Multifile example must have an entryPoint... ' +
        JSON.stringify(example.data)
    );
  }

  return {
    ...example,
    data: {
      // Default Values
      id: data?.id ?? defaultName.replace(/\//g, '-'),
      title: data?.title ?? defaultName,
      commands: [],
      // Provided Values
      ...data,
      // Normalized Values
      entryPoint: data.entryPoint ? join(root, data.entryPoint) : files[0].path,
      fileMap: data.fileMap
        ? Object.fromEntries(
            Object.entries(data.fileMap).map(([k, v]) => [join(root, k), v])
          )
        : {},
    },
  };
}

function loadExampleFile(path: string): {
  contents: string;
  data: FrontMatter;
} {
  const contents = readFileSync(path, 'utf-8');
  const lines = contents.split('\n');
  const frontMatterLines = [];

  // On windows the line may still contain a \r,
  // this would fail the front matter parsing.
  let line = lines.shift().trimEnd();
  if (line && line.startsWith('// ---')) {
    while (true) {
      line = lines.shift().trimEnd();
      if (!line) {
        throw new Error('Unexpected end of file');
      }
      if (line.startsWith('// ---')) {
        break;
      } else {
        frontMatterLines.push(line.replace(/^\/\/\s?/, ''));
      }
    }
  } else if (line) {
    lines.unshift(line);
  }

  const yaml = frontMatterLines.join('\n');

  return {
    contents: lines.join('\n'),
    data: yaml ? loadYaml(yaml) : {},
  };
}

export function collectMultifileExample(
  root: string,
  files: Dirent[]
): Example {
  const meta = loadYaml(readFileSync(join(root, 'meta.yml'), 'utf-8'));

  const collected: {
    path: string;
    contents: string;
  }[] = [];

  function collectFiles(root: string, files: Dirent[]) {
    for (const file of files) {
      const path = join(root, file.name);
      if (file.isDirectory()) {
        collectFiles(path, readdirSync(path, { withFileTypes: true }));
      } else if (path !== join(root, 'meta.yml')) {
        collected.push({
          path: normalize(path),
          contents: readFileSync(path, 'utf-8'),
        });
      }
    }
  }

  collectFiles(root, files);

  // Ensure's entry point is first file.
  const entryPointIdx =
    meta.entryPoint &&
    collected.findIndex(({ path }) => path === join(root, meta.entryPoint));

  if (entryPointIdx && entryPointIdx !== -1) {
    const entryPoint = collected.splice(entryPointIdx, 1);
    collected.unshift(entryPoint[0]);
  } else if (meta.entryPoint) {
    throw new Error(
      `Entry point "${meta.entryPoint}" not found in multifile example`
    );
  }

  return normalizeFrontMatter(root, {
    files: collected,
    data: meta,
  });
}

// returns all .ts files from given path
export function collectExamples(root: string): Example[] {
  const files = readdirSync(root, { withFileTypes: true });
  if (files.find((file) => file.name === 'meta.yml')) {
    return [collectMultifileExample(root, files)];
  }

  const collected: Example[] = [];

  for (const file of files) {
    if (file.isDirectory()) {
      collected.push(...collectExamples(join(root, file.name)));
    } else {
      if (file.name.endsWith('.ts')) {
        const path = normalize(join(root, file.name));
        const loaded = loadExampleFile(path);
        const normalized = normalizeFrontMatter(root, {
          files: [{ path, contents: loaded.contents }],
          data: loaded.data,
        });
        collected.push(normalized);
      }
    }
  }
  return collected;
}
