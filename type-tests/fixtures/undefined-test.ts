// Test if undefined array access errors
const bam: string[] | undefined = undefined;
bam.join("");  // Should error because bam could be undefined
