import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { WorkspaceDefinition } from './../workspace';
import { updateWorkspaceDefinition } from './../workspace';

import { ProjectDefinition } from './types';

type Updater = (project: ProjectDefinition | any) => void | PromiseLike<void>;

export function updateProjectDefinition(projectName: string, updater: Updater): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    return updateWorkspaceDefinition(async (workspace: WorkspaceDefinition) => {
      const project = workspace.projects.get(projectName);
      const result = updater(project);
      if (result) {
        await result;
      }
    });
  };
}
