import { Tree } from '@angular-devkit/schematics';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { JsonParseMode, parseJson } from '@wdtk/core';

export * from './mock-builder-context';

export function createEmptyWorkspace(host: Tree = null): Tree {
  if (!host) {
    host = Tree.empty();
  }
  host.create('/package.json', JSON.stringify({ name: 'empty', dependencies: {}, devDependencies: {} }));
  return host;
}

// tslint:disable-next-line: no-any
export function getJsonFileContent(tree: UnitTestTree, path: string): any {
  return parseJson(tree.readContent(path).toString(), JsonParseMode.Loose);
}
