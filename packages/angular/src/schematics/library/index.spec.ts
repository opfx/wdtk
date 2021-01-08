import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getProjectDefinition, getWorkspaceDefinition, readJsonInTree } from '@wdtk/core';

import { createEmptyWorkspace } from '@wdtk/core/testing';

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
    it(`should generate required files for a library`, async () => {
      const tree = await runSchematic(defaultOptions);
      expect(tree.exists('test-lib/src/lib/test-lib-module.ts'));
      expect(tree.exists('test-lib/src/lib/test-lib-component.ts'));
      expect(tree.exists('test-lib/src/lib/test-lib-service.ts'));
    });

    it(`should create a valid project definition in the workspace`, async () => {
      const tree = await runSchematic(defaultOptions);
      const workspace = await getWorkspaceDefinition(tree);
      expect(workspace.projects.has('test-lib')).toBeTruthy();

      const project = workspace.projects.get('test-lib');
      expect(project.root).toEqual('/test-lib');
      expect(project.sourceRoot).toEqual('/test-lib/src');
    });

    it(`should add required project dependencies`, async () => {
      const tree = await runSchematic(defaultOptions);
      const { dependencies, peerDependencies } = readJsonInTree(tree, '/test-lib/package.json');
      expect(dependencies['tslib']).toBeDefined();
      expect(peerDependencies['@angular/common']).toBeDefined();
      expect(peerDependencies['@angular/core']).toBeDefined();
    });

    it(`should add the 'public-api.ts' the workspace 'tsconfig.json' `, async () => {
      const tree = await runSchematic(defaultOptions);
      expect(tree.exists('tsconfig.json'));
      const tsConfig = readJsonInTree(tree, 'tsconfig.json');
      expect(tsConfig.compilerOptions.paths['@empty/test-lib']).toBeDefined();
      expect(Array.isArray(tsConfig.compilerOptions.paths['@empty/test-lib']));

      expect(tsConfig.compilerOptions.paths['@empty/test-lib']).toEqual(expect.arrayContaining(['/test-lib/src/public-api.ts']));
    });
  });
  describe(`using --directory`, () => {
    it(`should generate required files for a library in the specified directory`, async () => {
      const tree = await runSchematic({ ...defaultOptions, directory: 'libs/test-lib' });
      expect(tree.exists('libs/test-lib/src/lib/test-lib-module.ts'));
      expect(tree.exists('libs/test-lib/src/lib/test-lib-component.ts'));
      expect(tree.exists('libs/test-lib/src/lib/test-lib-service.ts'));
    });

    it(`should add required project dependencies in project's 'package.json' in the specified directory `, async () => {
      const tree = await runSchematic({ ...defaultOptions, directory: 'libs/test-lib' });
      const { dependencies, peerDependencies } = readJsonInTree(tree, '/libs/test-lib/package.json');
      expect(dependencies['tslib']).toBeDefined();
      expect(peerDependencies['@angular/common']).toBeDefined();
      expect(peerDependencies['@angular/core']).toBeDefined();
    });

    it(`should add the correct path to 'public-api.ts' the workspace 'tsconfig.json' `, async () => {
      const tree = await runSchematic({ ...defaultOptions, directory: 'libs/test-lib' });
      expect(tree.exists('tsconfig.json'));
      const tsConfig = readJsonInTree(tree, 'tsconfig.json');
      expect(tsConfig.compilerOptions.paths['@empty/test-lib']).toBeDefined();
      expect(Array.isArray(tsConfig.compilerOptions.paths['@empty/test-lib']));

      expect(tsConfig.compilerOptions.paths['@empty/test-lib']).toEqual(expect.arrayContaining(['libs/test-lib/src/public-api.ts']));
    });
  });

  describe(`--unit-test-runner`, () => {
    describe(`jest (default)`, () => {
      it(`should create 'jest' files`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Jest });
        expect(tree.exists('test-lib/jest.config.js')).toBeTruthy();
        expect(tree.exists('test-lib/tsconfig.spec.json')).toBeTruthy();
        expect(tree.exists('test-lib/src/test-setup.ts')).toBeTruthy();
      });

      it(`should not create 'karma' files`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Jest });
        expect(tree.exists('test-lib/karma.conf.js')).toBeFalsy();
        expect(tree.exists('test-lib/src/test.ts')).toBeFalsy();
      });

      it(`should create 'test' target with 'jest' builder`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Jest });
        const project = await getProjectDefinition(tree, 'test-lib');
        const testTarget = project.targets.get('test');
        expect(testTarget).toBeTruthy();
        expect(testTarget.builder).toEqual('@wdtk/jest:jest');
      });
    });
    describe(`karma`, () => {
      it(`should create 'karma' files`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Karma });
        expect(tree.exists('test-lib/karma.conf.js')).toBeTruthy();
        expect(tree.exists('test-lib/tsconfig.spec.json')).toBeTruthy();
        expect(tree.exists('test-lib/src/test.ts')).toBeTruthy();
      });

      it(`should add 'karma' dependencies to workspace`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Karma });
        const { devDependencies } = readJsonInTree(tree, 'package.json');
        // we only need to test one to see if the init schematic did it's job
        expect(devDependencies['karma']).toBeDefined();
      });
      it(`should create 'test' target with 'karma' builder`, async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: UnitTestRunner.Karma });
        const project = await getProjectDefinition(tree, 'test-lib');
        const testTarget = project.targets.get('test');
        expect(testTarget).toBeTruthy();
        expect(testTarget.builder).toEqual('@angular-devkit/build-angular:karma');
      });
    });
    describe(`none`, () => {});
  });
});
