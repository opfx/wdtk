import { chain, move, schematic } from '@angular-devkit/schematics';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { formatFiles, updateWorkspaceDefinition } from '@wdtk/core';

import { Schema as InitOptions } from './schema';

export default function (opts: Partial<InitOptions>): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    ctx.logger.debug(`▶ Running '@wdtk/php:init' schematic`);
    return chain([setupWorkspaceDefinition(opts), formatFiles(opts)]);
  };
}

function setupWorkspaceDefinition(opts: InitOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    return updateWorkspaceDefinition((workspace) => {
      if (!workspace.extensions.natures) {
        workspace.extensions.natures = {};
      }
      if (!workspace.extensions.natures['@wdtk/php']) {
        workspace.extensions.natures['@wdtk/php'] = { name: 'PHP' };
      }
    });
  };
}

function normalizeOptions(tree: Tree, opts: Partial<InitOptions>): InitOptions {
  return {
    ...opts,
  };
}
