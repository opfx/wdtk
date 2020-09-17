import { Tree } from '@angular-devkit/schematics';
import { workspaces } from '@angular-devkit/core';

import { WorkspaceDefinition } from './types';

export function getWorkspaceConfigPath(host: Tree) {
  const configFiles = ['.angular.json', 'angular.json'];
  return configFiles.filter((path) => host.exists(path))[0];
}

/**
 * Returns the workspace definition for the specified Tree.
 * @param tree
 * @param path
 */
export async function getWorkspaceDefinition(tree: Tree, path = '/'): Promise<WorkspaceDefinition> {
  const host = createHost(tree);
  const { workspace } = await workspaces.readWorkspace(path, host);
  return workspace;
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
