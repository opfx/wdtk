import { OverwriteFileAction, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { getWorkspaceDefinition } from '@wdtk/core';

import { noop } from '@angular-devkit/schematics';
import { filter, map, mergeMap } from 'rxjs/operators';
import * as Path from 'path';
import { workspace } from '@angular-devkit/core/src/experimental';

export function addInstallTask(options: { skipInstall?: boolean } = { skipInstall: false }): Rule {
  if (options.skipInstall) {
    return;
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
