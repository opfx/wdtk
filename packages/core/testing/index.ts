import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { JsonParseMode, parseJson } from '@wdtk/core';

export * from './mock-builder-context';

export function createEmptyWorkspace(tree: Tree = null): Tree {
  if (!tree) {
    tree = Tree.empty();
  }
  tree.create('/package.json', JSON.stringify({ name: 'empty', dependencies: {}, devDependencies: {} }));
  tree.create('/.angular.json', JSON.stringify({ version: 1, projects: {}, newProjectRoot: '' }));
  return tree;
}

// tslint:disable-next-line: no-any
export function getJsonFileContent(tree: UnitTestTree, path: string): any {
  return parseJson(tree.readContent(path).toString(), JsonParseMode.Loose);
}
