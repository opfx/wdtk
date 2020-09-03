import { chain, schematic } from '@angular-devkit/schematics';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { Schema as NgNewOptions } from './schema';
interface NormalizedOptions extends NgNewOptions {
  directory: string;
}
export default function (options: NgNewOptions): Rule {
  const opts = normalizeOptions(options);
  return (host: Tree, ctx: SchematicContext) => {
    return chain([schematic('workspace', { ...opts })]);
  };
}

function normalizeOptions(opts: NgNewOptions): NormalizedOptions {
  const directory = opts.directory || opts.name;
  return {
    ...opts,
    directory,
  };
}
