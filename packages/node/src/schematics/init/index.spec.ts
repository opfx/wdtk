import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { Schema as InitOptions } from './schema';
import { UnitTestRunner } from './schema';

const schematicCollection = '@wdtk/node';
const schematicName = 'library';

describe('node init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should add required by node projects dependencies`, async () => {
    const tree = await runSchematic({ unitTestRunner: UnitTestRunner.Jest });
    const { devDependencies } = getJsonFileContent(tree, 'package.json');
    const expectedDependencies = ['@wdtk/node'];
    expectedDependencies.forEach((dependencyName) => {
      expect(devDependencies[dependencyName]).toBeDefined();
    });
  });

  it(`should configure jest if unitTestRunner is jest`, async () => {
    const tree = await runSchematic({ unitTestRunner: UnitTestRunner.Jest });
    expect(tree.exists('jest.config.js')).toEqual(true);
  });

  it(`should not configure jest if unitTestRunner is none`, async () => {
    const tree = await runSchematic({ unitTestRunner: UnitTestRunner.None });
    expect(tree.exists('jest.config.js')).toEqual(false);
  });
});