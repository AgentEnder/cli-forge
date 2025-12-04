import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Result of creating a TypeScript program from a file or code string
 */
export interface ProgramResult {
  program: ts.Program;
  typeChecker: ts.TypeChecker;
  sourceFile: ts.SourceFile;
}

/**
 * Find tsconfig.json by walking up from the given file path
 * @param fromPath - Starting path (file or directory)
 * @returns Path to tsconfig.json or undefined if not found
 */
export function findTsConfig(fromPath: string): string | undefined {
  let currentDir = fs.statSync(fromPath).isDirectory()
    ? fromPath
    : path.dirname(fromPath);

  while (true) {
    const configPath = path.join(currentDir, 'tsconfig.json');
    if (fs.existsSync(configPath)) {
      return configPath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached root directory
      return undefined;
    }
    currentDir = parentDir;
  }
}

/**
 * Read and parse tsconfig.json with extends resolution
 * @param configPath - Path to tsconfig.json
 * @returns Parsed compiler options and file patterns
 */
function readTsConfig(configPath: string): {
  options: ts.CompilerOptions;
  fileNames: string[];
} {
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

  if (parsedConfig.errors.length > 0) {
    const errorMessages = parsedConfig.errors
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
      .join('\n');
    throw new Error(`Error parsing tsconfig.json: ${errorMessages}`);
  }

  return {
    options: parsedConfig.options,
    fileNames: parsedConfig.fileNames,
  };
}

/**
 * Create a TypeScript program from a source file
 * Uses the project's tsconfig.json for accurate type resolution
 *
 * @param filePath - Absolute path to the TypeScript file
 * @returns Program, type checker, and source file
 * @throws Error if tsconfig.json not found or file doesn't exist
 */
export function createProgramFromFile(filePath: string): ProgramResult {
  if (!path.isAbsolute(filePath)) {
    throw new Error(`File path must be absolute, got: ${filePath}`);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const configPath = findTsConfig(filePath);
  if (!configPath) {
    throw new Error(
      `Could not find tsconfig.json walking up from: ${filePath}`
    );
  }

  const { options, fileNames } = readTsConfig(configPath);

  const host = ts.createCompilerHost(options);
  const program = ts.createProgram(fileNames, options, host);

  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    throw new Error(`Could not load source file: ${filePath}`);
  }

  return {
    program,
    typeChecker: program.getTypeChecker(),
    sourceFile,
  };
}

/**
 * Create a TypeScript program from an in-memory code string
 * Useful for testing and quick type analysis
 *
 * @param code - TypeScript code to analyze
 * @param fileName - Virtual file name (default: '__test__.ts')
 * @returns Program, type checker, and source file
 */
export function createTestProgram(
  code: string,
  fileName = '__test__.ts'
): ProgramResult {
  // Create a virtual file system host
  const files = new Map<string, string>();
  files.set(fileName, code);

  // Default compiler options for test programs
  const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    skipLibCheck: true,
    noImplicitAny: true,
    esModuleInterop: true,
    resolveJsonModule: true,
  };

  // Create a custom compiler host that reads from our virtual file system
  const host = ts.createCompilerHost(defaultOptions);
  const originalGetSourceFile = host.getSourceFile;

  host.getSourceFile = (
    fileName: string,
    languageVersion: ts.ScriptTarget,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean
  ) => {
    const code = files.get(fileName);
    if (code !== undefined) {
      return ts.createSourceFile(fileName, code, languageVersion);
    }
    return originalGetSourceFile(
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile
    );
  };

  host.fileExists = (fileName: string) => {
    return files.has(fileName) || fs.existsSync(fileName);
  };

  host.readFile = (fileName: string) => {
    const code = files.get(fileName);
    if (code !== undefined) {
      return code;
    }
    if (fs.existsSync(fileName)) {
      return fs.readFileSync(fileName, 'utf-8');
    }
    return undefined;
  };

  const program = ts.createProgram([fileName], defaultOptions, host);
  const sourceFile = program.getSourceFile(fileName);
  if (!sourceFile) {
    throw new Error(`Could not create source file for: ${fileName}`);
  }

  return {
    program,
    typeChecker: program.getTypeChecker(),
    sourceFile,
  };
}
