import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, noop } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { addWorkspaceDependencies, formatFiles } from '@wdtk/core';
import { NodeDependency, NodeDependencyType } from '@wdtk/core';
import { getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';

import { Schema } from './schema';
import { UnitTestRunner } from './schema';
import { versions } from './../../versions';

export const workspaceDependencies: NodeDependency[] = [
  // dev dependencies
  { name: '@wdtk/node', type: NodeDependencyType.Dev, version: versions.Wdtk },
];

export interface InitOptions extends Schema {}

export default function (opts: InitOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      externalSchematic('@wdtk/workspace', 'typescript', { skipInstall: true }), //
      opts.unitTestRunner === UnitTestRunner.Jest ? externalSchematic('@wdtk/jest', 'init', opts) : noop(),
      addWorkspaceDependencies(workspaceDependencies),
      setupWorkspaceDefinition(opts),
      formatFiles(opts),
      addTasks(opts),
    ]);
  };
}

function setupWorkspaceDefinition(opts: InitOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    return updateWorkspaceDefinition((workspace) => {
      if (!workspace.extensions.natures) {
        workspace.extensions.natures = {};
      }
      if (!workspace.extensions.natures['@wdtk/node']) {
        workspace.extensions.natures['@wdtk/node'] = { name: 'Node' };
      }
    });
  };
}

async function normalizeOptions(tree: Tree, opts: InitOptions): Promise<InitOptions> {
  return {
    ...opts,
  };
}

function addTasks(opts: InitOptions): Rule {
  if (opts.skipInstall) {
    return noop();
  }
  return async (tree: Tree, ctx: SchematicContext) => {
    let packageManager = 'yarn';
    const workspace = await getWorkspaceDefinition(tree);
    if (workspace.extensions.cli && workspace.extensions.cli['packageManager']) {
      packageManager = workspace.extensions.cli['packageManager'];
    }
    ctx.addTask(new NodePackageInstallTask({ packageManager }));
  };
}
