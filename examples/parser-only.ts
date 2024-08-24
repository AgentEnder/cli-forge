// ---
// id: parser-only
// title: Parser Only
// description: |
//   This example demonstrates how to use [@cli-forge/parser](https://npmjs.com/@cli-forge/parser) to interpret CLI arguments
//   without the need for a CLI framework. For single-command CLIs, this may be enough.
// commands:
//   - '{filename} --name sir'
// ---
import { parser } from '@cli-forge/parser';

const argv = parser()
  .option('name', {
    type: 'string',
    description: 'The name to say hello to',
    default: 'World',
  })
  .parse(process.argv.slice(2));

console.log(`Hello, ${argv.name}!`);
