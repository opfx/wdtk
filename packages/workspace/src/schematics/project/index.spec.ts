import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { readJsonInTree, offsetFromRoot } from '@wdtk/core';
import { strings } from '@wdtk/core/util';
import { createEmptyWorkspace } from '@wdtk/core/testing';

import { Schema as ProjectOptions } from './schema';

const schematicCollection = '@wdtk/workspace';
const schematicName = 'project';

const defaultOptions: ProjectOptions = {
  name: 'bar',
  projectRoot: 'projects/bar',
};

describe('php project schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: ProjectOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(() => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should create project's vscode workspace file`, async () => {
    const tree = await runSchematic(defaultOptions);
    expect(tree.exists(`/${defaultOptions.projectRoot}/${defaultOptions.name}.code-workspace`)).toBeTruthy();
  });

  it(`should configure project's folder in the vscode workspace file`, async () => {
    const tree = await runSchematic(defaultOptions);
    const { folders } = readJsonInTree(tree, `/${defaultOptions.projectRoot}/${defaultOptions.name}.code-workspace`);

    expect(folders).toBeDefined();

    const folder = folders[0];

    expect(typeof folder).toEqual('object');
    expect(folder.name).toEqual(strings.capitalize(defaultOptions.name));
    expect(folder.path).toEqual('.');
  });
});
