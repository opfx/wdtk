import { chain, move, schematic } from '@angular-devkit/schematics';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { Schema as ApplicationOptions } from './schema';

interface NormalizedOptions extends ApplicationOptions {}
export default function (options: ApplicationOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    ctx.logger.info('Running app schematic');
    return chain([]);
  };
}

function normalizeOptions(opts: ApplicationOptions): NormalizedOptions {
  return {
    ...opts,
  };
}
