/**
 * Tests both overloads of getCommandContext:
 * - Overload 1: instance passed as type witness
 * - Overload 2: explicit generic parameter
 */
import { cli } from 'cli-forge';
import { getCommandContext } from 'cli-forge/context';

const app = cli('test')
  .option('name', { type: 'string' })
  .provide('svc', { hello: 'world' });

// Overload 1: inferred from instance — app is passed as a type witness
function test1() {
  const ctx = getCommandContext(app);
  const name: string | undefined = ctx.args.name;
  const svc = ctx.inject('svc');
  const hello: string = svc.hello;
  void name;
  void hello;
}

// Overload 2: explicit generic — no instance passed
function test2() {
  const ctx = getCommandContext<typeof app>();
  const name: string | undefined = ctx.args.name;
  const svc = ctx.inject('svc');
  const hello: string = svc.hello;
  void name;
  void hello;
}

void test1;
void test2;
