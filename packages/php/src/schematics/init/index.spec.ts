import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getProjectDefinition } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';

import { Schema as InitOptions } from './schema';

const schematicCollection = '@wdtk/php';
const schematicName = 'init';

describe('php init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it('should create application files', async () => {});
});
