import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { runCommand } from '../utils/child_process';
import { checkFilesExist } from '../utils/fs';
import {
  e2eProjectDir,
  ensureCleanWorkingDirectory,
  setProjectDir,
} from '../utils/setup';

describe('generate-documentation', () => {
  beforeEach(() => {
    ensureCleanWorkingDirectory();
  });

  it('should include resolved env keys in generated documentation', async () => {
    await runCommand('npx cli-forge@e2e init env-docs-cli', [], {});
    setProjectDir('env-docs-cli');

    writeFileSync(
      join(e2eProjectDir, 'bin', 'env-cli.ts'),
      `
import cli from 'cli-forge';

export default cli('my-app')
  .env()
  .option('name', { type: 'string', description: 'The name' })
  .option('greeting', { type: 'string', env: 'customGreeting' })
  .option('port', { type: 'number', env: { key: 'port', prefix: false } })
  .option('debug', { type: 'boolean', env: false, description: 'Debug mode' });
`.trimStart()
    );

    const jsonDir = join(e2eProjectDir, 'docs-data');
    await runCommand(
      `npx cli-forge generate-documentation ./bin/env-cli.ts --format json --output ${jsonDir} --no-llms`,
      [],
      {}
    );

    const docsPath = join(jsonDir, 'my-app.json');
    checkFilesExist([docsPath]);

    const docs = JSON.parse(readFileSync(docsPath, 'utf-8'));

    // Global .env() + option key → MY_APP_NAME
    expect(docs.options.name.resolvedEnvKey).toBe('MY_APP_NAME');
    // Global prefix + explicit camelCase env key → MY_APP_CUSTOM_GREETING
    expect(docs.options.greeting.resolvedEnvKey).toBe('MY_APP_CUSTOM_GREETING');
    // prefix: false on object form → no prefix applied → PORT
    expect(docs.options.port.resolvedEnvKey).toBe('PORT');
    // env: false → no env var
    expect(docs.options.debug.resolvedEnvKey).toBeUndefined();

    // Generate markdown and verify env vars appear in rendered output
    const mdDir = join(e2eProjectDir, 'docs-md');
    await runCommand(
      `npx cli-forge generate-documentation ./bin/env-cli.ts --format md --output ${mdDir}`,
      [],
      {}
    );

    const mdPath = join(e2eProjectDir, 'my-app.md');
    checkFilesExist([mdPath]);

    const commandMd = readFileSync(mdPath, 'utf-8');
    expect(commandMd).toContain('MY_APP_NAME');
    expect(commandMd).toContain('MY_APP_CUSTOM_GREETING');
    expect(commandMd).toContain('PORT');
    // debug has env: false, so no env var should appear for it
    expect(commandMd).not.toContain('MY_APP_DEBUG');

    // Verify llms.txt includes env var lines
    const llmsPath = join(mdDir, 'llms.txt');
    checkFilesExist([llmsPath]);

    const llmsTxt = readFileSync(llmsPath, 'utf-8');
    expect(llmsTxt).toContain('Env var: MY_APP_NAME');
    expect(llmsTxt).toContain('Env var: MY_APP_CUSTOM_GREETING');
    expect(llmsTxt).toContain('Env var: PORT');
    expect(llmsTxt).not.toContain('MY_APP_DEBUG');
    expect(llmsTxt).not.toContain('MY_APP_PORT');
  });

  it('should generate docs with configuration sources', async () => {
    // Scaffold a project so cli-forge is installed
    await runCommand('npx cli-forge@e2e init docs-cli', [], {});
    setProjectDir('docs-cli');

    // Write a CLI that uses config providers
    writeFileSync(
      join(e2eProjectDir, 'bin', 'configured.ts'),
      `
import { cli, ConfigurationProviders } from 'cli-forge';

export default cli('configured', {
  builder: (args) =>
    args
      .option('name', { type: 'string' })
      .option('greeting', { type: 'string' })
      .config(ConfigurationProviders.PackageJson('configured'))
      .config(ConfigurationProviders.JsonFile('configured.config.json'))
      .config(
        ConfigurationProviders.JsonFile('other.config.json', 'configured')
      ),
  handler: (args) => {
    console.log(args.greeting, args.name);
  },
});
`.trimStart()
    );

    // Write a config file so the provider can resolve it
    writeFileSync(
      join(e2eProjectDir, 'configured.config.json'),
      JSON.stringify({ name: 'world', greeting: 'Hello' }, null, 2)
    );

    // Generate JSON documentation into a directory.
    // Use --no-llms to avoid the llms.txt write conflicting with the JSON output path.
    const jsonDir = join(e2eProjectDir, 'docs-data');
    await runCommand(
      `npx cli-forge generate-documentation ./bin/configured.ts --format json --output ${jsonDir} --no-llms`,
      [],
      {}
    );

    const docsPath = join(jsonDir, 'configured.json');
    checkFilesExist([docsPath]);

    const docs = JSON.parse(readFileSync(docsPath, 'utf-8'));

    // Verify configurationSources is present and describes all three providers
    expect(docs.configurationSources).toBeDefined();
    expect(docs.configurationSources).toHaveLength(3);

    // PackageJson provider
    expect(docs.configurationSources[0].heading).toMatch(/package\.json/);
    expect(docs.configurationSources[0].body).toBeTruthy();

    // JsonFile provider (no key)
    expect(docs.configurationSources[1].heading).toMatch(
      /configured\.config\.json/
    );
    expect(docs.configurationSources[1].body).toBeTruthy();

    // JsonFile provider (with key)
    expect(docs.configurationSources[2].heading).toMatch(/other\.config\.json/);
    expect(docs.configurationSources[2].heading).toMatch(/configured/);
    expect(docs.configurationSources[2].body).toBeTruthy();

    // Generate markdown docs
    const mdDir = join(e2eProjectDir, 'docs-md');
    await runCommand(
      `npx cli-forge generate-documentation ./bin/configured.ts --format md --output ${mdDir}`,
      [],
      {}
    );

    // For a CLI without subcommands, --output is treated as a file path base,
    // so the command file and configuration.md land in dirname(output).
    const mdParent = e2eProjectDir;

    // Verify configuration.md is generated as a separate file
    const configMdPath = join(mdParent, 'configuration.md');
    checkFilesExist([configMdPath]);

    const configMd = readFileSync(configMdPath, 'utf-8');
    expect(configMd).toContain('Configuration');
    expect(configMd).toContain('package.json');
    expect(configMd).toContain('configured.config.json');
    expect(configMd).toContain('other.config.json');

    // Verify the command page links to configuration.md instead of embedding it
    const commandMdPath = join(mdParent, 'configured.md');
    checkFilesExist([commandMdPath]);

    const commandMd = readFileSync(commandMdPath, 'utf-8');
    expect(commandMd).toContain('configuration.md');

    // Verify llms.txt includes configuration (written to --output dir)
    const llmsPath = join(mdDir, 'llms.txt');
    checkFilesExist([llmsPath]);

    const llmsTxt = readFileSync(llmsPath, 'utf-8');
    expect(llmsTxt).toContain('Configuration:');
  });
});
