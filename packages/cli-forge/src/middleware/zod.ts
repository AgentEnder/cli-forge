import { ParsedArgs } from '@cli-forge/parser';
import { MiddlewareFunction } from '../lib/public-api';
import type { z, ZodObject, ZodPipe } from 'zod';

/*
 * Middleware that uses a Zod schema to validate and transform command arguments.
 * @param schema The Zod schema to use for validation and transformation.
 * @returns A middleware function that applies the Zod schema to the command arguments.
 */
export function zodMiddleware<
  TArgs extends ParsedArgs,
  TSchema extends ZodObject | ZodPipe<ZodObject>
>(schema: TSchema): MiddlewareFunction<TArgs, TArgs & z.infer<TSchema>> {
  return async (args: TArgs) => {
    const parsed = (await schema.parseAsync(args)) as z.infer<TSchema>;
    if (typeof parsed !== 'object') {
      throw new Error('Zod schema did not return an object');
    }
    return { ...args, ...parsed };
  };
}
