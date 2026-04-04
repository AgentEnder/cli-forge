import { existsSync, readFileSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// #region custom-provider
class KeyValueConfigLoader<T>
  implements ConfigurationFiles.ConfigurationProvider<T, string>
{
  private readonly filename: string;

  constructor(options: { filename: string }) {
    this.filename = options.filename;
  }

  resolve(configurationRoot: string): string | undefined {
    let dir = configurationRoot;
    let prev: string | undefined;
    while (prev !== dir) {
      prev = dir;
      const candidate = join(dir, this.filename);
      if (existsSync(candidate)) return candidate;
      dir = dirname(dir);
    }
    return undefined;
  }

  load(filepath: string): T & { extends?: string } {
    const content = readFileSync(filepath, 'utf-8');
    const result: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      result[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
    return result as T & { extends?: string };
  }

  async updateConfig(
    configOrUpdater: T | ((current: T) => T | Promise<T>),
    options?: { targetPath?: string }
  ): Promise<void> {
    const filepath = options?.targetPath ?? this.resolve(process.cwd());
    if (!filepath) {
      throw new Error(`Could not resolve ${this.filename}`);
    }

    const current = existsSync(filepath)
      ? this.load(filepath)
      : ({} as T);
    const updated =
      typeof configOrUpdater === 'function'
        ? await (configOrUpdater as (c: T) => T | Promise<T>)(current)
        : configOrUpdater;

    const lines = Object.entries(updated as Record<string, unknown>)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    await mkdir(dirname(filepath), { recursive: true });
    await writeFile(filepath, lines + '\n');
  }
}
// #endregion custom-provider

(async () =>
  await cli('kv-tool', {
    builder: (args) =>
      args
        .option('greeting', { type: 'string', default: 'hello' })
        .option('name', { type: 'string', default: 'world' })
        .config(new KeyValueConfigLoader({ filename: '.kvconfig' })),
    handler: (args) => {
      console.log(`${args.greeting}, ${args.name}!`);
    },
  }).forge())();
