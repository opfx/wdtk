import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as LibraryOptions } from './schema';

import { createEmptyWorkspace } from '@wdtk/core/testing';

const schematicCollection = '@wdtk/jest';
const schematicName = 'library';

const defaultOptions: LibraryOptions = {
  name: 'bar',
};

describe('php library schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: LibraryOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(() => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should create project's composer manifest file`, async () => {
    const tree = await runSchematic(defaultOptions);
    expect(tree.exists('/bar/composer.json')).toBeTruthy();
  });
});
