import { chain, move, schematic } from '@angular-devkit/schematics';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { formatFiles, updateWorkspaceDefinition } from '@wdtk/core';

import { Schema as InitOptions } from './schema';

export default function (opts: Partial<InitOptions>): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([registerNature(), formatFiles(opts)]);
  };
}

function registerNature(): Rule {
  return updateWorkspaceDefinition((workspace) => {
    if (!workspace.extensions.natures) {
      workspace.extensions.natures = {};
    }
    workspace.extensions.natures['PHP'] = { collectionName: '@wdtk/php' };
  });
}

function normalizeOptions(tree: Tree, opts: Partial<InitOptions>): InitOptions {
  return {
    ...opts,
  };
}
