import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, noop, schematic } from '@angular-devkit/schematics';

import { updateWorkspaceDefinition } from '@wdtk/core';

import { Schema } from './schema';

export interface ApplicationOptions extends Schema {}

export default function (opts: ApplicationOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('init', { ...opts, skipInstall: true, skipFormat: true }),
      generateFiles(opts),
      generateProjectDefinition(opts),
      setupUnitTestRunner(opts),
    ]);
  };
}

function generateFiles(opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {};
}

function generateProjectDefinition(opts: ApplicationOptions): Rule {
  return updateWorkspaceDefinition((workspace) => {});
}

function setupUnitTestRunner(opts: ApplicationOptions): Rule {
  return noop();
}

async function normalizeOptions(tree: Tree, opts: ApplicationOptions): Promise<ApplicationOptions> {
  return {
    ...opts,
  };
}
