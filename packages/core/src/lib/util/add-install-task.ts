import { OverwriteFileAction, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { noop } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { getWorkspaceDefinition } from '@wdtk/core';

export function addInstallTask(options: { skipInstall?: boolean } = { skipInstall: false }): Rule {
  if (options.skipInstall) {
    return noop();
  }
  return async (tree: Tree, ctx: SchematicContext) => {
    const workspace = await getWorkspaceDefinition(tree);
    let packageManager;
    if (workspace.extensions.cli && workspace.extensions.cli['packageManager']) {
      packageManager = workspace.extensions.cli['packageManager'];
    }
    ctx.logger.debug('Root package.json has changed, scheduling install task.');
    ctx.addTask(new NodePackageInstallTask({ packageManager }));
  };
}

/**
 * Just kept for reference
 * @param options
 */
export function addInstallTaskA(options: { skipInstall?: boolean } = { skipInstall: false }): Rule {
  if (options.skipInstall) {
    return noop();
  }
  return async (tree: Tree, ctx: SchematicContext) => {
    let shouldScheduleTask = false;

    tree.actions
      .filter((action) => action.path === '/package.json')
      .filter((action) => action.kind === 'o')
      .map((action: OverwriteFileAction) => {
        shouldScheduleTask = true;
      });
    if (shouldScheduleTask) {
      const workspace = await getWorkspaceDefinition(tree);
      let packageManager;
      if (workspace.extensions.cli && workspace.extensions.cli['packageManager']) {
        packageManager = workspace.extensions.cli['packageManager'];
      }
      ctx.logger.debug('Root package.json has changed, scheduling install task.');
      ctx.addTask(new NodePackageInstallTask({ packageManager }));
    }
  };
}
