import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { getWorkspaceDefinition } from './../workspace';
import { ProjectDefinition } from './types';

/**
 * Returns the project definition for the specified project in the given Tree.
 * @param tree
 * @param path
 */
export async function getProjectDefinition(tree: Tree, projectName: string): Promise<ProjectDefinition> {
  const workspace = await getWorkspaceDefinition(tree);
  const project = workspace.projects.get(projectName);
  if (!project) {
    throw new SchematicsException(`Project name "${projectName}" doesn't not exist.`);
  }
  return project;
}
