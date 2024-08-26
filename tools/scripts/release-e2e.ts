import { execSync } from 'child_process';
import { releasePublish, releaseVersion } from 'nx/release';

export async function releaseE2EVersion(version: string): Promise<void> {
  const registry = execSync('npm config get registry').toString().trim();
  if (!registry.includes('localhost')) {
    throw new Error('Local registry is not configured');
  }
  await releaseVersion({
    specifier: '0.0.0-e2e',
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    generatorOptionsOverrides: {
      skipLockFileUpdate: true,
      currentVersionResolver: 'registry',
    },
  });
  await releasePublish({
    tag: 'e2e',
    firstRelease: true,
  });
}

if (require.main === module) {
  releaseE2EVersion('0.0.0-e2e').catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
