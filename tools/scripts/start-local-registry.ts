/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */
import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { execSync } from 'child_process';
import { releasePublish, releaseVersion } from 'nx/release';
import { releaseE2EVersion } from './release-e2e';

export default async () => {
  // local registry target to run
  const localRegistryTarget = '@cli-forge/source:local-registry';
  // storage folder for the local registry
  const storage = './tmp/local-registry/storage';

  (global as any).stopLocalRegistry = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: process.env.NX_VERBOSE_LOGGING === 'true',
  });

  execSync('npx -y clear-npx-cache');

  await releaseE2EVersion('0.0.0-e2e');
};
