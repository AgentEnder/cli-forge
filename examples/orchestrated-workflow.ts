// ---
// id: orchestrated-workflow
// title: Orchestrated Workflow
// description: |
//   Demonstrates a parent command that programmatically executes its child
//   commands in sequence, passing data from one step to the next. This pattern
//   is useful for building multi-step workflows like release pipelines, build
//   systems, or deployment scripts.
//
//   The example shows:
//   - Accessing child command handlers via `getChildren()`
//   - Typed handler return values that flow between steps
//   - Composing reusable option builders with `makeComposableBuilder`
//   - Error handling across the workflow
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

// Shared options used across multiple commands
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

// Types for data passed between workflow steps
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

// Child command: validate
// Checks preconditions and returns validation state
const withValidateCommand = makeComposableBuilder((args) =>
  args.command('validate', {
    description: 'Check that the project is ready for release',
    builder: (cmd) => chain(cmd, withProjectOption),
    handler: (args): ValidationResult => {
      console.log(`Validating ${args.project}...`);

      // In a real CLI, you'd check git status, run tests, etc.
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

// Child command: build
// Compiles the project and returns build artifacts
const withBuildCommand = makeComposableBuilder((args) =>
  args.command('build', {
    description: 'Build the project for distribution',
    builder: (cmd) => chain(cmd, withProjectOption),
    handler: (args): BuildResult => {
      console.log(`Building ${args.project}...`);

      // Simulate build process
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

// Child command: publish
// Publishes build artifacts to a registry
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

// Main CLI: orchestrates the full release workflow
cli('release', {
  description: 'Release workflow that validates, builds, and publishes',
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

    // Get typed handlers for each step
    const validateHandler = children.validate.getHandler();
    const buildHandler = children.build.getHandler();
    const publishHandler = children.publish.getHandler();

    if (!validateHandler || !buildHandler || !publishHandler) {
      throw new Error('Missing required command handlers');
    }

    console.log(`Starting release workflow for ${project}`);
    console.log(dryRun ? '(dry run mode)\n' : '\n');

    // Step 1: Validate
    // The return type is inferred as ValidationResult
    const validation = await validateHandler({ project });

    if (!validation.isClean) {
      console.error('Validation failed - aborting release');
      process.exitCode = 1;
      return;
    }
    console.log('');

    // Step 2: Build
    // We can use data from the previous step
    const build = await buildHandler({ project: validation.project });
    console.log('');

    // Step 3: Publish
    // Combines data from validation and build steps
    const publish = await publishHandler({
      project: build.project,
      dryRun,
      registry: 'https://registry.npmjs.org',
    });
    console.log('');

    // Summary using typed results from all steps
    console.log('='.repeat(40));
    console.log('Release complete!');
    console.log(`  Project: ${publish.project}`);
    console.log(`  Version: ${publish.publishedVersion}`);
    console.log(`  Artifacts: ${build.artifacts.length} files`);
    console.log(`  Registry: ${publish.registry}`);
  },
}).forge();
