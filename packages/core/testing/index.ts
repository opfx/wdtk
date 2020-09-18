import { Tree } from '@angular-devkit/schematics';

export * from './mock-builder-context';

export function createEmptyWorkspace(host: Tree = null): Tree {
  if (!host) {
    host = Tree.empty();
  }
  host.create('/package.json', JSON.stringify({ name: 'empty', dependencies: {}, devDependencies: {} }));
  return host;
}
