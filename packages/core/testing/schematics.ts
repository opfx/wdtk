import { Tree } from '@angular-devkit/schematics';

import { UnitTestTree } from '@angular-devkit/schematics/testing';

import { JsonParseMode, parseJson } from '@wdtk/core';
export function createEmptyWorkspace(tree: Tree = null): Tree {
  if (!tree) {
    tree = Tree.empty();
  }
  tree.create('/package.json', JSON.stringify({ name: 'empty', dependencies: {}, devDependencies: {} }));
  tree.create('/.angular.json', JSON.stringify({ version: 1, projects: {}, newProjectRoot: '' }));
  return tree;
}

/**
 * @deprecated use readJsonInTree instead
 * @param tree
 * @param path
 */
// tslint:disable-next-line: no-any
export function getJsonFileContent(tree: UnitTestTree, path: string): any {
  return parseJson(tree.readContent(path).toString(), JsonParseMode.Loose);
}

export function getFileContent(tree: Tree, path: string): string {
  const fileEntry = tree.get(path);

  if (!fileEntry) {
    throw new Error(`The file (${path}) does not exist.`);
  }

  return fileEntry.content.toString();
}
