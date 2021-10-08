import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@wdtk/core/testing';
import { readJsonInTree } from '@wdtk/core';

import { Schema as InitOptions } from './schema';

const schematicCollection = '@wdtk/nest';
const schematicName = 'init';

describe('node init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it('should add dependencies', async () => {
    const tree = await runSchematic({ unitTestRunner: 'jest' } as any);
    const { dependencies, devDependencies } = readJsonInTree(tree, 'package.json');

    expect(dependencies['@nestjs/common']).toBeDefined();
    expect(dependencies['@nestjs/core']).toBeDefined();
    expect(dependencies['@nestjs/platform-express']).toBeDefined();
    expect(dependencies['reflect-metadata']).toBeDefined();
    expect(dependencies['rxjs']).toBeDefined();

    expect(devDependencies['@nestjs/schematics']).toBeDefined();
    expect(devDependencies['@nestjs/testing']).toBeDefined();
  });

  it('should configure jest if unitTestRunner is jest', async () => {
    const tree = await runSchematic({ unitTestRunner: 'jest' } as any);
    expect(tree.exists('jest.config.js')).toEqual(true);
  });

  it('should not configure jest if unitTestRunner is none', async () => {
    const tree = await runSchematic({ unitTestRunner: 'none' } as any);
    expect(tree.exists('jest.config.js')).toEqual(false);
  });
});
