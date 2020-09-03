import { apply, branchAndMerge, chain, mergeWith, template, url } from '@angular-devkit/schematics';
import { Rule, SchematicsException, SchematicContext, Tree } from '@angular-devkit/schematics';

import { strings } from '@angular-devkit/core';

import { Schema as WorkspaceOptions } from './schema';

interface NormalizedOptions extends WorkspaceOptions {}

export default function (options: WorkspaceOptions): Rule {
  if (!options.name) {
    throw new SchematicsException(`Invalid options, 'name' is required.`);
  }
  const opts = normalizeOptions(options);
  return async (host: Tree, ctx: SchematicContext) => {
    const templateSource = apply(url('./files'), [template({ dot: '.', tmpl: '', strings, ...opts })]);
    return chain([branchAndMerge(chain([mergeWith(templateSource)]))]);
  };
}

// export  function a(options: ApplicationOptions): Rule {
//   return async (host: Tree) => {
//     if (!options.name) {
//       throw new SchematicsException(`Invalid options, "name" is required.`);
//     }

//     return chain([
//     ]);
//   };
// }

function normalizeOptions(options: WorkspaceOptions): NormalizedOptions {
  return { ...options };
}
