import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { workspaces } from '@angular-devkit/core';

import { addPackageJsonDependency } from './../../package';
import { NodeDependency } from './../../package';

import { WorkspaceDefinition } from './../types';
import { createHost } from './../util';

export function addWorkspaceDependency(dependency: NodeDependency): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(` ∙ adding workspace dependency (${dependency.type}): '${dependency.name}@${dependency.version}'`);
    addPackageJsonDependency(host, dependency);
  };
}

export function addWorkspaceDependencies(dependencies: NodeDependency[]): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    dependencies.forEach((dependency) => {
      ctx.logger.debug(` ∙ adding workspace dependency (${dependency.type}): '${dependency.name}@${dependency.version}'`);
      addPackageJsonDependency(host, dependency);
    });
  };
}

export function updateWorkspaceDefinition(updater: (workspace: WorkspaceDefinition) => void | PromiseLike<void>): Rule;
export function updateWorkspaceDefinition(workspace: WorkspaceDefinition): Rule;
export function updateWorkspaceDefinition(updaterOrWorkspace: WorkspaceDefinition | ((workspace: WorkspaceDefinition) => void | PromiseLike<void>)): Rule {
  return async (host: Tree, ctx: SchematicContext) => {
    const _host = createHost(host);

    if (typeof updaterOrWorkspace === 'function') {
      const { workspace } = await workspaces.readWorkspace('/', _host);
      const result = updaterOrWorkspace(workspace);
      if (result) {
        await result;
      }
      updaterOrWorkspace = workspace;
    }
    await workspaces.writeWorkspace(updaterOrWorkspace, _host);
  };
}
