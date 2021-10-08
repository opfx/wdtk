import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { getWorkspaceDefinition } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';

import { Schema as InitOptions } from './schema';
import { UnitTestRunner } from './schema';

const schematicCollection = '@wdtk/node';
const schematicName = 'library';

const defaultOpts: InitOptions = {
  name: 'test-lib',
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

  it(`should generate node library files`, async () => {
    const tree = await runSchematic(defaultOpts);
    expect(tree.exists(`/${defaultOpts.name}/package.json`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/tsconfig.lib.json`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/tsconfig.json`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/tslint.json`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/src/index.ts`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/src/lib/test-lib.ts`)).toBeTruthy();
  });

  describe(`--directory`, () => {
    it('should generate node library files in the specified directory', async () => {
      const tree = await runSchematic({ ...defaultOpts, directory: `libs/${defaultOpts.name}` });
      expect(tree.exists(`libs/${defaultOpts.name}/package.json`)).toBeTruthy();
      expect(tree.exists(`/libs/${defaultOpts.name}/tsconfig.lib.json`)).toBeTruthy();
      expect(tree.exists(`/libs/${defaultOpts.name}/tsconfig.json`)).toBeTruthy();
      expect(tree.exists(`/libs/${defaultOpts.name}/src/index.ts`)).toBeTruthy();
    });
  });

  describe(`--unitTestRunner`, () => {
    it('should configure jest if unitTestRunner is jest', async () => {
      const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.Jest });
      expect(tree.exists('jest.config.js')).toBeTruthy();
    });

    it('should generate jest test files if unitTestRunner is jest', async () => {
      const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.Jest });
      expect(tree.exists(`/${defaultOpts.name}/src/lib/${defaultOpts.name}.spec.ts`)).toBeTruthy();
    });

    it('should not configure jest if unitTestRunner is none', async () => {
      const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.None });
      expect(tree.exists('jest.config.js')).toBeFalsy();
    });

    it('should not generate jest test files if unitTestRunner is jest', async () => {
      const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.None });
      expect(tree.exists(`/${defaultOpts.name}/src/lib/${defaultOpts.name}.spec.ts`)).toBeFalsy();
    });
  });
});
