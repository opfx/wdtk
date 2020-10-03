import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { Schema } from './schema';

export interface InitOptions extends Schema {}

export default function (opts: InitOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    opts = normalizeOptions(tree, opts);
  };
}

function normalizeOptions(tree: Tree, opts: Partial<InitOptions>): InitOptions {
  return {
    ...opts,
  };
}
