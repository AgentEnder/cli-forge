import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getJsonFileConfigLoader,
  JsonFileConfigLoader,
} from './json-file-loader.js';
import { isAggregateConfigProvider } from './aggregate-config-provider.js';
import {
  MemoryEnvironmentProvider,
  MemoryFileSystemProvider,
  getEnvironmentProvider,
  getFileSystemProvider,
  setEnvironmentProvider,
  setFileSystemProvider,
} from '../environment-provider.js';

describe('getJsonFileConfigLoader', () => {
  it('should return a ConfigurationProvider for a single filename', () => {
    const loader = getJsonFileConfigLoader('config.json');
    expect(isAggregateConfigProvider(loader)).toBe(false);
    expect(loader).toHaveProperty('resolve');
  });

  it('should return an AggregateConfigProvider for multiple filenames', () => {
    const loader = getJsonFileConfigLoader(['config.json', 'alt.config.json']);
    expect(isAggregateConfigProvider(loader)).toBe(true);
  });

  it('should construct multiple leaf providers for multiple filenames', () => {
    const loaders = new JsonFileConfigLoader({
      filename: ['config.json', 'alt.config.json'],
    });

    expect(Array.isArray(loaders)).toBe(true);
    expect(loaders).toHaveLength(2);
    expect(loaders[0]).toHaveProperty('resolve');
    expect(isAggregateConfigProvider(loaders[0])).toBe(false);
  });
});

describe('JsonFileConfigLoader updateConfig', () => {
  let originalEnv: ReturnType<typeof getEnvironmentProvider>;
  let originalFs: ReturnType<typeof getFileSystemProvider>;
  let fs: MemoryFileSystemProvider;

  beforeEach(() => {
    originalEnv = getEnvironmentProvider();
    originalFs = getFileSystemProvider();
    fs = new MemoryFileSystemProvider();
    setEnvironmentProvider(new MemoryEnvironmentProvider({ cwd: '/root' }));
    setFileSystemProvider(fs);
  });

  afterEach(() => {
    setEnvironmentProvider(originalEnv);
    setFileSystemProvider(originalFs);
  });

  it('updates an existing file resolved from cwd', async () => {
    fs.writeFileSync(
      '/root/app.config.json',
      JSON.stringify({ theme: 'light', lang: 'en' })
    );
    const loader = new JsonFileConfigLoader<{ theme: string; lang: string }>({
      filename: 'app.config.json',
    });

    await loader.updateConfig!({ theme: 'dark', lang: 'fr' });

    const written = JSON.parse(fs.readFileSync('/root/app.config.json'));
    expect(written).toEqual({ theme: 'dark', lang: 'fr' });
  });

  it('creates a new file at targetPath when none exists', async () => {
    const loader = new JsonFileConfigLoader<{ theme: string }>({
      filename: 'app.config.json',
    });

    await loader.updateConfig!(
      { theme: 'dark' },
      { targetPath: '/fresh/app.config.json' }
    );

    expect(fs.existsSync('/fresh/app.config.json')).toBe(true);
    expect(JSON.parse(fs.readFileSync('/fresh/app.config.json'))).toEqual({
      theme: 'dark',
    });
  });

  it('passes an empty object to the updater when creating a fresh file at targetPath', async () => {
    const loader = new JsonFileConfigLoader<{ count: number; name: string }>({
      filename: 'app.config.json',
    });

    let receivedCurrent: any;
    await loader.updateConfig!(
      (current) => {
        receivedCurrent = current;
        return { count: 1, name: 'seeded' };
      },
      { targetPath: '/fresh/app.config.json' }
    );

    expect(receivedCurrent).toEqual({});
    expect(JSON.parse(fs.readFileSync('/fresh/app.config.json'))).toEqual({
      count: 1,
      name: 'seeded',
    });
  });

  it('creates parent directories when targetPath points into a nested folder', async () => {
    let recursiveRequested = false;
    const delegate = fs;
    setFileSystemProvider({
      ...delegate,
      existsSync: (p) => delegate.existsSync(p),
      readFileSync: (p) => delegate.readFileSync(p),
      writeFileSync: (p, d) => delegate.writeFileSync(p, d),
      writeFile: (p, d) => delegate.writeFile(p, d),
      appendFileSync: (p, d) => delegate.appendFileSync(p, d),
      readdirSync: (p) => delegate.readdirSync(p),
      mkdirSync: (dir, options) => {
        if (options?.recursive) recursiveRequested = true;
        delegate.mkdirSync(dir, options);
      },
      join: (...p) => delegate.join(...p),
      resolve: (...p) => delegate.resolve(...p),
      dirname: (p) => delegate.dirname(p),
      basename: (p) => delegate.basename(p),
    });

    const loader = new JsonFileConfigLoader<{ port: number }>({
      filename: 'app.config.json',
    });

    await loader.updateConfig!(
      { port: 3000 },
      { targetPath: '/home/user/.config/my-tool/app.config.json' }
    );

    expect(recursiveRequested).toBe(true);
  });

  it('prefers resolved file over targetPath when the file already exists there', async () => {
    fs.writeFileSync(
      '/fresh/app.config.json',
      JSON.stringify({ theme: 'light' })
    );
    const loader = new JsonFileConfigLoader<{ theme: string }>({
      filename: 'app.config.json',
    });

    await loader.updateConfig!(
      { theme: 'dark' },
      { targetPath: '/fresh/app.config.json' }
    );

    // File exists at targetPath so its contents are merged with the update
    expect(JSON.parse(fs.readFileSync('/fresh/app.config.json'))).toEqual({
      theme: 'dark',
    });
  });

  it('supports URL as targetPath', async () => {
    const loader = new JsonFileConfigLoader<{ theme: string }>({
      filename: 'app.config.json',
    });

    await loader.updateConfig!(
      { theme: 'dark' },
      { targetPath: new URL('file:///fresh/via-url.json') }
    );

    expect(fs.existsSync('/fresh/via-url.json')).toBe(true);
    expect(JSON.parse(fs.readFileSync('/fresh/via-url.json'))).toEqual({
      theme: 'dark',
    });
  });

  it('throws when no file resolves and no targetPath is provided', async () => {
    const loader = new JsonFileConfigLoader<{ theme: string }>({
      filename: 'app.config.json',
    });

    await expect(loader.updateConfig!({ theme: 'dark' })).rejects.toThrow(
      /Could not resolve configuration file/
    );
  });

  it('throws when transform is used without writeTransform', async () => {
    const loader = new JsonFileConfigLoader<{ theme: string }>({
      filename: 'app.config.json',
      transform: (json) => json.section,
    });

    await expect(
      loader.updateConfig!(
        { theme: 'dark' },
        { targetPath: '/fresh/app.config.json' }
      )
    ).rejects.toThrow(/write transform/);
  });

  it('applies writeTransform when the file is created at targetPath', async () => {
    const loader = new JsonFileConfigLoader<{ theme: string }>({
      filename: 'app.config.json',
      transform: (json) => json.section ?? {},
      writeTransform: (json, config) => ({ ...json, section: config }),
    });

    await loader.updateConfig!(
      { theme: 'dark' },
      { targetPath: '/fresh/wrapped.json' }
    );

    const written = JSON.parse(fs.readFileSync('/fresh/wrapped.json'));
    expect(written).toEqual({ section: { theme: 'dark' } });
  });
});
