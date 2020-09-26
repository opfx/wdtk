import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { strings } from '@wdtk/core/util';
import { readJsonInTree } from '../json';

export function normalizePackageName(tree: Tree, projectName: string): string {
  const rootPackageJson = readJsonInTree(tree, '/package.json');
  const rootPackageName = rootPackageJson.name;

  projectName = normalizeProjectName(projectName);
  let scopeName = rootPackageName;
  if (/^@.*\/.*/.test(rootPackageName)) {
    const [scope, name] = rootPackageName.split('/');
    scopeName = scope.replace(/^@/, '');
  }
  return `@${scopeName}/${projectName}`;
}

export function normalizeProjectName(projectName: string): string {
  if (projectName.length === 0) {
    throw new SchematicsException(`The project name cannot not be empty.`);
  }
  const lcName = projectName.toLowerCase();
  const normalizedName = strings.dasherize(lcName);
  const normalizedNameFragments = normalizedName.split('-');
  if (normalizedNameFragments[0].length >= 3) {
    return normalizedName;
  }
  return lcName;
}
