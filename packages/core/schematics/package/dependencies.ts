import { Tree } from '@angular-devkit/schematics';
import { JsonFile } from './../json';

const DEFAULT_PACKAGE_JSON_PATH = '/package.json';

export enum NodeDependencyType {
  Default = 'dependencies',
  Dev = 'devDependencies',
  Peer = 'peerDependencies',
  Optional = 'optionalDependecies',
}

export interface NodeDependency {
  type: NodeDependencyType;
  name: string;
  version: string;
  overwrite?: boolean;
}

const ALL_DEPENDENCY_TYPE = [NodeDependencyType.Default, NodeDependencyType.Dev, NodeDependencyType.Optional, NodeDependencyType.Peer];

export function addPackageJsonDependency(tree: Tree, dependency: NodeDependency, packageJsonPath: string = DEFAULT_PACKAGE_JSON_PATH): void {
  const json = new JsonFile(tree, packageJsonPath);
  if (json.error) {
    throw json.error;
  }

  const { overwrite, type, name, version } = dependency;
  const path = [type, name];
  if (overwrite || !json.get(path)) {
    json.modify(path, version);
  }
}

export function removePackageJsonDependency(tree: Tree, name: string, packageJsonPath: string = DEFAULT_PACKAGE_JSON_PATH): void {
  const json = new JsonFile(tree, packageJsonPath);
  if (json.error) {
    throw json.error;
  }

  for (const depType of ALL_DEPENDENCY_TYPE) {
    json.remove([depType, name]);
  }
}

export function getPackageJsonDependency(tree: Tree, name: string, packageJsonPath: string = DEFAULT_PACKAGE_JSON_PATH): NodeDependency | null {
  const json = new JsonFile(tree, packageJsonPath);
  if (json.error) {
    throw json.error;
  }

  for (const depType of ALL_DEPENDENCY_TYPE) {
    const version = json.get([depType, name]);

    if (typeof version === 'string') {
      return {
        type: depType,
        name: name,
        version,
      };
    }
  }

  return null;
}
