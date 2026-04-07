import { execSync } from 'child_process';
import { releasePublish, releaseVersion } from 'nx/release';

const E2E_RELEASE_PROJECTS = ['cli-forge', 'parser'];

export async function releaseE2EVersion(version: string): Promise<void> {
  const registry = execSync('npm config get registry').toString().trim();
  if (!registry.includes('localhost')) {
    throw new Error('Local registry is not configured');
  }
  await releaseVersion({
    projects: E2E_RELEASE_PROJECTS,
    specifier: '0.0.0-e2e',
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    verbose: true,
  });
  await releasePublish({
    projects: E2E_RELEASE_PROJECTS,
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
