import { Tree } from '@angular-devkit/schematics';

export function createEmptyWorkspace(host: Tree = null): Tree {
  if (!host) {
    host = Tree.empty();
  }
  host.create('/package.json', JSON.stringify({ name: 'empty', dependencies: {}, devDependencies: {} }));
  return host;
}
