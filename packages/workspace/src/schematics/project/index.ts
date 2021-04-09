import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, move, mergeWith, url } from '@angular-devkit/schematics';

import { offsetFromRoot } from '@wdtk/core';
import { strings } from '@wdtk/core/util';

import { Schema } from './schema';

export interface ProjectOptions extends Schema {}

export default function (opts: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`▶ Running '@wdtk/workspace:project' schematic`);
    return chain([generateFiles(opts)]);
  };
}

/**
 * Generates the project files for the workspace project.
 * @param opts
 */
function generateFiles(opts: ProjectOptions): Rule {
  return mergeWith(
    apply(url('./files'), [
      applyTemplates({
        strings,
        ...opts,
        dot: '.',
        offsetFromRoot: offsetFromRoot(opts.projectRoot),
      }),
      move(opts.projectRoot),
    ])
  );
}
