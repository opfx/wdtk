import { chain, move, schematic } from '@angular-devkit/schematics';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { addInstallTask, formatFiles, getWorkspaceDefinition } from '@wdtk/core';
import { normalizeProjectName, normalizePackageName, offsetFromRoot, updateJsonInTree, updateWorkspaceDefinition } from '@wdtk/core';

import { Schema } from './schema';

interface LibraryOptions extends Schema {}
export default function (opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    ctx.logger.debug(`▶ Running '@wdtk/php:library' schematic`);
    return chain([schematic('init', { ...opts, skipFormat: true, skipInstall: true })]);
  };
}

async function normalizeOptions(tree: Tree, opts: LibraryOptions): Promise<LibraryOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot;

  opts.name = normalizeProjectName(opts.name);

  return {
    ...opts,
  };
}
