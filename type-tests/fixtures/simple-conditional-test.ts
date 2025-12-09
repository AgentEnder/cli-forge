/**
 * Simplest possible conditional type test
 */

type Config = { type: 'object' };

// Step 1: Does Config have required: true?
type Step1 = Config extends { required: true } ? 'yes' : 'no';
// @ts-expect-error: Intentional error to see type
const _step1: Step1 = 'force error';

// Step 2: Does Config have default: unknown?
type Step2 = Config extends { default: unknown } ? 'yes' : 'no';
// @ts-expect-error: Intentional error to see type
const _step2: Step2 = 'force error';

// Step 3: Full conditional
type Resolved = { host: string };
type WithOptionalInline<T, C> = C extends { required: true }
  ? T
  : C extends { default: unknown }
  ? T
  : T | undefined;

type Result = WithOptionalInline<Resolved, Config>;
// @ts-expect-error: Intentional error to see type
const _result: Result = 'force error';

// Step 4: Verify undefined is allowed
type CheckUndefined = undefined extends Result ? 'yes' : 'no';
// @ts-expect-error: Intentional error to see type
const _checkUndefined: CheckUndefined = 'force error';
