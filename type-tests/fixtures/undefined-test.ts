// Test if undefined array access errors - verifies strictNullChecks is enabled
const bam: string[] | undefined = undefined;
// @ts-expect-error: bam is possibly undefined - this error is expected with strictNullChecks
bam.join("");  // Should error because bam could be undefined
