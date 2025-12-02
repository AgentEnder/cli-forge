declare const cli: import("cli-forge").CLI<{
    unmatched: string[];
    '--'?: string[];
} & {
    foo: ({
        readonly bar: ({
            readonly baz: number | undefined;
        } & Record<string, never>) | undefined;
        readonly qux: number | undefined;
        readonly arr: number[] | undefined;
    } & Record<string, string>) | undefined;
}>;
export default cli;
