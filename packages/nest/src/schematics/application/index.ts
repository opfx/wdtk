import { Rule, MergeStrategy, SchematicContext, Tree } from '@angular-devkit/schematics';

import { apply, applyTemplates, chain, externalSchematic, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { formatFiles, getWorkspaceDefinition, updateJsonInTree } from '@wdtk/core';
import { normalizeProjectName, offsetFromRoot } from '@wdtk/core';

import { strings } from '@wdtk/core/util';

import { Schema } from './schema';

export interface ApplicationOptions extends Schema {
  projectRoot: string;
}

export default function (opts: ApplicationOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      //
      schematic('init', { ...opts, skipInstall: true, skipFormat: true }),
      externalSchematic('@wdtk/node', 'application', { ...opts, skipFormat: true }),
      generateProjectFiles(opts),
      setupProjectTsConfig(opts),
      formatFiles(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: ApplicationOptions): Promise<ApplicationOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot || '';

  opts.name = normalizeProjectName(opts.name);

  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  return {
    ...opts,

    projectRoot,
  };
}

function generateProjectFiles(opts: ApplicationOptions): Rule {
  return mergeWith(
    apply(url('./files'), [applyTemplates({ ...opts, offsetFromRoot: offsetFromRoot(opts.projectRoot) }), move(opts.projectRoot)]),
    MergeStrategy.Overwrite
  );
}

function setupProjectTsConfig(opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return updateJsonInTree(`${opts.projectRoot}/tsconfig.json`, (tsConfig) => {
      if (!tsConfig.compilerOptions) {
        tsConfig.compilerOptions = {};
      }
      tsConfig.compilerOptions.emitDecoratorMetadata = true;
      tsConfig.compilerOptions.target = 'es2015';
    });
  };
}
