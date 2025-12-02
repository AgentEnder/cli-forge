declare const cli: import("cli-forge").CLI<{
    unmatched: string[];
    '--'?: string[];
}>;
export default cli;
