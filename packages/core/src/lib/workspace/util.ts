import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { Tree } from '@angular-devkit/schematics';
import { workspaces } from '@angular-devkit/core';

import { findUp } from '@wdtk/core/util';

import { WorkspaceDefinition } from './types';

const configFiles = ['.angular.json', 'angular.json'];
// const cachedWorkspaces = new Map<string, WorkspaceDefinition | null>();

export function getWorkspaceDefinitionPath(tree: Tree) {
  // const configFiles = ['.angular.json', 'angular.json'];
  return configFiles.filter((path) => tree.exists(path))[0];
}

/**
 * This is a local utility function
 * should not be exported
 */
function localWorkspaceDefinitionPath(): string | null {
  return findUp(configFiles, process.cwd()) || findUp(configFiles, __dirname);
}

/**
 * Returns the workspace definition for the specified Tree.
 * @param tree
 * @param path
 */
export async function getWorkspaceDefinition(): Promise<WorkspaceDefinition>;
export async function getWorkspaceDefinition(path: string): Promise<WorkspaceDefinition>;
export async function getWorkspaceDefinition(tree: Tree): Promise<WorkspaceDefinition>;
export async function getWorkspaceDefinition(tree: Tree, path: string): Promise<WorkspaceDefinition>;
export async function getWorkspaceDefinition(tree: Tree | string = null, path = '/'): Promise<WorkspaceDefinition> {
  let host;
  if (!tree || typeof tree === 'string') {
    host = workspaces.createWorkspaceHost(new NodeJsSyncHost());
    if ((tree as string) === 'global') {
      // just in case we want to use a global configuration as angular does
    } else {
      path = localWorkspaceDefinitionPath();
    }
  } else {
    host = createHost(tree);
  }

  if (!path) {
    return null;
  }
  // const cached = cachedWorkspaces.get(path);
  // if (cached) {
  //   return cached;
  // }

  const { workspace } = await workspaces.readWorkspace(path, host);

  // cachedWorkspaces.set(path, workspace);

  return workspace;
}

export async function setWorkspaceDefinition(workspace: WorkspaceDefinition, tree: Tree): Promise<void> {
  const _host = createHost(tree);
  workspaces.writeWorkspace(workspace, _host);
}

export function createHost(tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile(path: string): Promise<string> {
      const data = tree.read(path);
      return data.toString();
    },
    async writeFile(path: string, data: string): Promise<void> {
      return tree.overwrite(path, data);
    },
    async isDirectory(path: string): Promise<boolean> {
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
    },
    async isFile(path: string): Promise<boolean> {
      return tree.exists(path);
    },
  };
}
