import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getProjectDefinition } from '@wdtk/core';

import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { Schema as LibraryOptions } from './schema';

enum UnitTestRunner {
  Jest = 'jest',
  Karma = 'karma',
  None = 'none',
}

const schematicCollection = '@wdtk/angular';
const schematicName = 'library';

describe(`angular library schematic`, () => {
  const defaultOptions: LibraryOptions = {
    name: 'testLib',
  };
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: LibraryOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  describe(`not using --directory)`, () => {
    it(`should generate required files`, async () => {
      const tree = await runSchematic(defaultOptions);
      expect(tree.exists('test-lib/src/lib/test-lib-module.ts'));
    });
  });
  describe(`using --directory`, () => {
    it(`should generate required files`, async () => {});
  });

  describe(`--unit-test-runner`, () => {
    describe(`jest (default)`, () => {});
    describe(`karma`, () => {
      it(`should create 'karma' files`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Karma });
        expect(tree.exists('test-lib/karma.conf.js')).toBeTruthy();
        expect(tree.exists('test-lib/tsconfig.spec.json')).toBeTruthy();
        expect(tree.exists('test-lib/src/test.ts')).toBeTruthy();
      });
      it(`should add 'karma' dependencies to workspace`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Karma });
        const { devDependencies } = getJsonFileContent(tree, 'package.json');
        // we only need to test one to see if the init schematic did it's job
        expect(devDependencies['karma']).toBeDefined();
      });
      it(`should create 'test' target with 'karma' builder`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Karma });
        const project = await getProjectDefinition(tree, defaultOptions.name);
        const testTarget = project.targets.get('test');
        expect(testTarget).toBeTruthy();
        expect(testTarget.builder).toEqual('@angular-devkit/build-angular:karma');
      });
    });
    describe(`none`, () => {});
  });
});
