import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { Schema } from './schema';

export interface LibraryOptions extends Schema {}

export default function (opts: LibraryOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    opts = normalizeOptions(tree, opts);
  };
}

function normalizeOptions(tree: Tree, opts: LibraryOptions): LibraryOptions {
  return {
    ...opts,
  };
}
