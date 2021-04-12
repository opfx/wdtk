import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getProjectDefinition } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';
import { readJsonInTree } from '@wdtk/core';
import { Schema as InitOptions } from './schema';

const schematicCollection = '@wdtk/php';
const schematicName = 'init';

const defaultOptions: InitOptions = {};

describe('php init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should add 'jest' dependencies`, async () => {
    const tree = await runSchematic(defaultOptions);
    const { devDependencies } = readJsonInTree(tree, 'package.json');

    expect(devDependencies['@wdtk/php']).toBeDefined();
    expect(devDependencies['@prettier/plugin-php']).toBeDefined();
  });
});
