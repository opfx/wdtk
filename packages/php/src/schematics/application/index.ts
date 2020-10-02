import { chain, move, schematic } from '@angular-devkit/schematics';
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';

import { Schema as ApplicationOptions } from './schema';

export default function (opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`Running '@wdtk/php:application' schematic`);
    opts = normalizeOptions(tree, opts);
    return chain([schematic('init', { ...opts, skipInstall: true })]);
  };
}

function normalizeOptions(tree: Tree, opts: ApplicationOptions): ApplicationOptions {
  if (!opts.name) {
    throw new SchematicsException(`Invalid options, "name" is required.`);
  }

  return {
    ...opts,
  };
}
