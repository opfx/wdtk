import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';

import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { Schema as ApplicationOptions } from './schema';

const schematicCollection = '@wdtk/angular';
const schematicName = 'application';

describe(`angular application schematic`, () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: ApplicationOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should do something`, async () => {});

  describe(`--unit-test-runner`, () => {
    describe(`jest (default)`, async () => {
      it(`should not create 'karma' files`, async () => {
        const tree = await runSchematic({ name: 'test-app', unitTestRunner: 'jest' } as any);
        expect(tree.exists('/test-app/karma.conf.js')).toBeFalsy();
        expect(tree.exists('/test-app/src/test.ts')).toBeFalsy();
      });

      it(`should create 'jest' configuration files`, async () => {
        const tree = await runSchematic({ name: 'test-app', unitTestRunner: 'jest' } as any);
        expect(tree.exists('/test-app/jest.config.js')).toBeTruthy();
        expect(tree.exists('/test-app/tsconfig.spec.json')).toBeTruthy();
        expect(tree.exists('/test-app/src/test-setup.ts')).toBeTruthy();
      });
    });
    describe(`karma`, () => {
      it(`should create 'karma' files`, async () => {
        const tree = await runSchematic({ name: 'test-app', unitTestRunner: 'karma' } as any);
        expect(tree.exists('/test-app/karma.conf.js')).toBeTruthy();
        expect(tree.exists('/test-app/tsconfig.spec.json')).toBeTruthy();
        expect(tree.exists('/test-app/src/test.ts')).toBeTruthy();
      });
    });

    describe(`none`, () => {
      it(`should not create 'karma' or 'jest' configuration files`, async () => {
        const tree = await runSchematic({ name: 'test-app', unitTestRunner: 'none' } as any);
        expect(tree.exists('/test-app/karma.conf.js')).toBeFalsy();
        expect(tree.exists('/test-app/src/test.ts')).toBeFalsy();
        expect(tree.exists('/test-app/jest.config.js')).toBeFalsy();
        expect(tree.exists('/test-app/src/test-setup.ts')).toBeFalsy();
        expect(tree.exists('/test-app/tsconfig.spec.json')).toBeFalsy();
      });

      it(`should not create any 'spec' files`, async () => {
        const tree = await runSchematic({ name: 'test-app', unitTestRunner: 'none' } as any);

        const specFilesPresent = tree.files.some((file: string) => {
          return file.includes('spec.ts') && file.includes('/src/');
        });
        expect(specFilesPresent).toEqual(false);
      });
    });
  });
});
