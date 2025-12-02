import { ParsedArgs } from '@cli-forge/parser';
import { MiddlewareFunction } from '../lib/public-api';
import type { z, ZodObject, ZodPipe } from 'zod';

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
