import { Tree } from '@angular-devkit/schematics';
export function getWorkspaceConfigPath(host: Tree) {
  const configFiles = ['.angular.json', 'angular.json'];
  return configFiles.filter((path) => host.exists(path))[0];
}
