import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { readJsonInTree } from '@wdtk/core';
import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { Schema as ApplicationOptions } from './schema';
import { UnitTestRunner } from './schema';
const schematicCollection = '@wdtk/nest';
const schematicName = 'application';

const defaultOpts: ApplicationOptions = {
  name: 'test-app',
};

describe('node init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: ApplicationOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it('should generate files', async () => {
    const tree = await runSchematic(defaultOpts);
    expect(tree.exists('test-app/src/main.ts')).toBe(true);
  });

  it('should have es2015 as the tsconfig target', async () => {
    const tree = await runSchematic(defaultOpts);
    const tsconfig = readJsonInTree(tree, 'test-app/tsconfig.json');
    expect(tsconfig.compilerOptions.target).toBe('es2015');
  });

  it('should have emitDecoratorMetadata true in tsconfig', async () => {
    const tree = await runSchematic(defaultOpts);
    const tsconfig = readJsonInTree(tree, 'test-app/tsconfig.json');
    expect(tsconfig.compilerOptions.emitDecoratorMetadata).toBe(true);
  });

  it('should not configure jest if unitTestRunner is none', async () => {
    const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.None });
    expect(tree.exists('jest.config.js')).toEqual(false);
  });

  describe(`using --directory)`, () => {
    it('should generate files in the specified directory', async () => {
      const tree = await runSchematic({ ...defaultOpts, directory: `apps/${defaultOpts.name}` });
      expect(tree.exists('apps/test-app/src/main.ts')).toBe(true);
    });

    it('should have es2015 as the tsconfig target when using --directory', async () => {
      const tree = await runSchematic({ ...defaultOpts, directory: `apps/${defaultOpts.name}` });
      const tsconfig = readJsonInTree(tree, 'apps/test-app/tsconfig.json');
      expect(tsconfig.compilerOptions.target).toBe('es2015');
    });

    it('should have emitDecoratorMetadata true in tsconfig when using -directory', async () => {
      const tree = await runSchematic({ ...defaultOpts, directory: `apps/${defaultOpts.name}` });
      const tsconfig = readJsonInTree(tree, 'apps/test-app/tsconfig.json');
      expect(tsconfig.compilerOptions.emitDecoratorMetadata).toBe(true);
    });
  });
});
