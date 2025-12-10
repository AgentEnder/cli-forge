// ---
// id: orchestrated-workflow
// title: Orchestrated Workflow
// description: |
//   A parent command that executes child commands in sequence, passing data
//   between steps. Useful for release pipelines, build systems, or deployments.
//
// commands:
//   - command: '{filename} --project my-app'
//     assertions:
//       - contains: 'Validating my-app'
//       - contains: 'Building my-app'
//       - contains: 'Publishing my-app'
//       - contains: 'Release complete'
//   - command: '{filename} validate --project my-app'
//     assertions:
//       - contains: 'Validating my-app'
//       - contains: 'Validation passed'
//   - command: '{filename} build --project my-app'
//     assertions:
//       - contains: 'Building my-app'
//       - contains: 'Build output'
// ---
import { cli, makeComposableBuilder, chain } from 'cli-forge';

// Shared options
const withProjectOption = makeComposableBuilder((args) =>
  args.option('project', {
    type: 'string',
    description: 'Project name to operate on',
    required: true,
  })
);

const withDryRunOption = makeComposableBuilder((args) =>
  args.option('dryRun', {
    type: 'boolean',
    description: 'Print what would happen without making changes',
    default: false,
  })
);

// Result types for each step
interface ValidationResult {
  project: string;
  isClean: boolean;
  version: string;
}

interface BuildResult {
  project: string;
  outputPath: string;
  artifacts: string[];
}

interface PublishResult {
  project: string;
  publishedVersion: string;
  registry: string;
}

const withValidateCommand = makeComposableBuilder((args) =>
  args.command('validate', {
    description: 'Check that the project is ready for release',
    builder: (cmd) => chain(cmd, withProjectOption),
    handler: (args): ValidationResult => {
      console.log(`Validating ${args.project}...`);

      const result: ValidationResult = {
        project: args.project,
        isClean: true,
        version: '1.2.3',
      };

      console.log(`Validation passed: ${args.project} v${result.version}`);
      return result;
    },
  })
);

const withBuildCommand = makeComposableBuilder((args) =>
  args.command('build', {
    description: 'Build the project for distribution',
    builder: (cmd) => chain(cmd, withProjectOption),
    handler: (args): BuildResult => {
      console.log(`Building ${args.project}...`);

      const result: BuildResult = {
        project: args.project,
        outputPath: `dist/${args.project}`,
        artifacts: [`${args.project}.js`, `${args.project}.d.ts`],
      };

      console.log(`Build output: ${result.outputPath}`);
      console.log(`Artifacts: ${result.artifacts.join(', ')}`);
      return result;
    },
  })
);

const withPublishCommand = makeComposableBuilder((args) =>
  args.command('publish', {
    description: 'Publish the built package to npm',
    builder: (cmd) =>
      chain(cmd, withProjectOption, withDryRunOption).option('registry', {
        type: 'string',
        description: 'Registry URL',
        default: 'https://registry.npmjs.org',
      }),
    handler: (args): PublishResult => {
      const action = args.dryRun ? '[dry-run] Would publish' : 'Publishing';
      console.log(`${action} ${args.project} to ${args.registry}...`);

      const result: PublishResult = {
        project: args.project,
        publishedVersion: '1.2.3',
        registry: args.registry,
      };

      if (!args.dryRun) {
        console.log(`Published ${result.project}@${result.publishedVersion}`);
      }
      return result;
    },
  })
);

cli('release', {
  description: 'Validate, build, and publish a project',
  builder: (args) =>
    chain(
      args,
      withProjectOption,
      withDryRunOption,
      withValidateCommand,
      withBuildCommand,
      withPublishCommand
    ),

  handler: async (args, ctx) => {
    const { project, dryRun } = args;
    const children = ctx.command.getChildren();

    const validateHandler = children.validate.getHandler();
    const buildHandler = children.build.getHandler();
    const publishHandler = children.publish.getHandler();

    if (!validateHandler || !buildHandler || !publishHandler) {
      throw new Error('Missing required command handlers');
    }

    console.log(`Starting release workflow for ${project}`);
    console.log(dryRun ? '(dry run mode)\n' : '\n');

    const validation = await validateHandler({ project });
    if (!validation.isClean) {
      console.error('Validation failed - aborting release');
      process.exitCode = 1;
      return;
    }
    console.log('');

    const build = await buildHandler({ project: validation.project });
    console.log('');

    const publish = await publishHandler({
      project: build.project,
      dryRun,
      registry: 'https://registry.npmjs.org',
    });
    console.log('');

    console.log('='.repeat(40));
    console.log('Release complete!');
    console.log(`  Project: ${publish.project}`);
    console.log(`  Version: ${publish.publishedVersion}`);
    console.log(`  Artifacts: ${build.artifacts.length} files`);
    console.log(`  Registry: ${publish.registry}`);
  },
}).forge();
