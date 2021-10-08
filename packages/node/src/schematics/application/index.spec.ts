import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { getWorkspaceDefinition } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';

import { Schema as InitOptions } from './schema';
import { UnitTestRunner } from './schema';

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

  it(`should generate node application files`, async () => {
    const tree = await runSchematic(defaultOpts);
    expect(tree.exists('/test-app/tsconfig.app.json')).toBeTruthy();
    expect(tree.exists('/test-app/tsconfig.json')).toBeTruthy();
    expect(tree.exists('/test-app/src/main.ts')).toBeTruthy();
    expect(tree.exists('/test-app/src/environments/environment.ts')).toBeTruthy();
    expect(tree.exists('/test-app/src/environments/environment.prod.ts')).toBeTruthy();
  });

  it(`should generate a valid 'lint' target in the node project definition`, async () => {
    const tree = await runSchematic(defaultOpts);
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get('test-app');
    const lintTarget = project.targets.get('lint');

    expect(lintTarget).toBeDefined();
  });

  describe(`--directory`, () => {
    it('should generate node application files in the specified directory', async () => {
      const tree = await runSchematic({ ...defaultOpts, directory: 'apps/test-app' });
      expect(tree.exists('/apps/test-app/tsconfig.app.json')).toBeTruthy();
      expect(tree.exists('/apps/test-app/tsconfig.json')).toBeTruthy();
      expect(tree.exists('/apps/test-app/src/main.ts')).toBeTruthy();
      expect(tree.exists('/apps/test-app/src/environments/environment.ts')).toBeTruthy();
      expect(tree.exists('/apps/test-app/src/environments/environment.prod.ts')).toBeTruthy();
    });
  });

  describe(`--unitTestRunner`, () => {
    it('should not configure jest if unitTestRunner is none', async () => {
      const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.None });
      expect(tree.exists('jest.config.js')).toEqual(false);
    });
  });
});
