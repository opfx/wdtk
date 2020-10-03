import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, schematic } from '@angular-devkit/schematics';
import { Schema } from './schema';

export interface ApplicationOptions extends Schema {}

export default function (opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    opts = normalizeOptions(tree, opts);
    return chain([
      //
      schematic('init', { ...opts, skipInstall: true, skipFormat: true }),
    ]);
  };
}

function normalizeOptions(tree: Tree, opts: ApplicationOptions): ApplicationOptions {
  return {
    ...opts,
  };
}
