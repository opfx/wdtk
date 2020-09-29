import { Rule, SchematicsException, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getWorkspaceDefinition } from './../workspace';
import { ProjectDefinition } from './types';
import { addPackageJsonDependency } from './../package';
import { NodeDependency } from './../package';
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

export function addProjectDependencies(projectName: string, dependencies: NodeDependency[]): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    const project = await getProjectDefinition(tree, projectName);
    const projectPackageJson = `${project.root}/package.json`;
    dependencies.forEach((dependency) => {
      ctx.logger.debug(`adding workspace '${dependency.type}' dependency '${dependency.name}@${dependency.version}'`);
      addPackageJsonDependency(tree, dependency, projectPackageJson);
    });
  };
}
