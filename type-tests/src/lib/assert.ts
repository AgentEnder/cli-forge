import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { findTsConfig } from './compiler.js';

/**
 * Result of running type assertions on a file
 */
export interface AssertionResult {
  /** The assertion file that was checked */
  file: string;
  /** Whether all assertions passed (no type errors) */
  passed: boolean;
  /** Array of error messages from TypeScript */
  errors: string[];
  /** Total number of errors found */
  errorCount: number;
}

/**
 * Run type assertions on a TypeScript file using tsc --noEmit
 *
 * @param assertionFile - Absolute path to the assertion file
 * @returns Result containing pass/fail status and any errors
 * @throws Error if file doesn't exist or tsconfig.json not found
 */
export function runAssertions(assertionFile: string): AssertionResult {
  if (!path.isAbsolute(assertionFile)) {
    throw new Error(`File path must be absolute, got: ${assertionFile}`);
  }

  if (!fs.existsSync(assertionFile)) {
    throw new Error(`File not found: ${assertionFile}`);
  }

  const configPath = findTsConfig(assertionFile);
  if (!configPath) {
    throw new Error(
      `Could not find tsconfig.json walking up from: ${assertionFile}`
    );
  }

  // Read and parse tsconfig.json
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      `Error reading tsconfig.json: ${ts.flattenDiagnosticMessageText(
        configFile.error.messageText,
        '\n'
      )}`
    );
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );

  // Create program with just the assertion file
  const program = ts.createProgram({
    rootNames: [assertionFile],
    options: {
      ...parsedConfig.options,
      noEmit: true,
    },
  });

  // Get all diagnostics (syntax, semantic, and declaration errors)
  const allDiagnostics = ts.getPreEmitDiagnostics(program);

  // Filter diagnostics to only those from the assertion file
  const fileDiagnostics = allDiagnostics.filter(
    (diagnostic) =>
      diagnostic.file &&
      path.resolve(diagnostic.file.fileName) === path.resolve(assertionFile)
  );

  // Format error messages
  const errors = fileDiagnostics.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    );

    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line, character } =
        diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const fileName = path.basename(diagnostic.file.fileName);
      return `${fileName}:${line + 1}:${character + 1} - ${message}`;
    }

    return message;
  });

  return {
    file: assertionFile,
    passed: errors.length === 0,
    errors,
    errorCount: errors.length,
  };
}
