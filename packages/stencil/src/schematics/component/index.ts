import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, externalSchematic, filter, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { formatFiles, getProjectDefinition, offsetFromRoot, updateWorkspaceDefinition } from '@wdtk/core';
import { getWorkspaceDefinition } from '@wdtk/core';
import { normalizePackageName, normalizeProjectName, updateJsonInTree } from '@wdtk/core';

import { strings } from '@wdtk/core/util';

import { Schema } from './schema';

export interface ComponentOptions extends Schema {
  projectSourceRoot: string;
  prefix: string;
}

export default function (opts: ComponentOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([generateFiles(opts), formatFiles(opts)]);
  };
}

async function normalizeOptions(tree: Tree, opts: ComponentOptions): Promise<ComponentOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  let prefix = workspace.extensions.defaultPrefix as string;

  const project = await getProjectDefinition(tree, opts.project);
  const projectSourceRoot = project.sourceRoot;

  return {
    ...opts,
    projectSourceRoot,
  };
}

function generateFiles(opts: ComponentOptions): Rule {
  const tag = `${opts.prefix}-${opts.name}`;
  return mergeWith(apply(url('./files'), [applyTemplates({ ...opts, ...strings, tag }), move(`${opts.projectSourceRoot}/components/${opts.name}`)]));
}
