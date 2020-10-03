import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { Schema as InitOptions } from './schema';

const schematicCollection = '@wdtk/node';
const schematicName = 'application';

const defaultOpts: InitOptions = {
  name: 'test-app',
};

describe('node init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it('should generate files', async () => {
    const tree = await runSchematic(defaultOpts);
  });

  it('should have es2015 as the tsconfig target', async () => {
    const tree = await runSchematic(defaultOpts);
  });

  it('should not configure jest if unitTestRunner is none', async () => {
    const tree = await runSchematic({ unitTestRunner: 'none' } as any);
    expect(tree.exists('jest.config.js')).toEqual(false);
  });
});
