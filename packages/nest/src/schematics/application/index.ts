import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { Schema } from './schema';

export interface ApplicationOptions extends Schema {}

export default function (opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    opts = normalizeOptions(tree, opts);
  };
}

function normalizeOptions(tree: Tree, opts: ApplicationOptions): ApplicationOptions {
  return {
    ...opts,
  };
}
