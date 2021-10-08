import { Tree } from '@angular-devkit/schematics';

import { UnitTestTree } from '@angular-devkit/schematics/testing';

export function createEmptyWorkspace(tree: Tree = null): Tree {
  if (!tree) {
    tree = Tree.empty();
  }
  tree.create('/package.json', JSON.stringify({ name: 'empty', dependencies: {}, devDependencies: {} }));
  tree.create('/.angular.json', JSON.stringify({ version: 1, projects: {}, newProjectRoot: '' }));
  return tree;
}

export function getFileContent(tree: Tree, path: string): string {
  const fileEntry = tree.get(path);

  if (!fileEntry) {
    throw new Error(`The file (${path}) does not exist.`);
  }

  return fileEntry.content.toString();
}
