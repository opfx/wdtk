import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getProjectDefinition } from '@wdtk/core';

import { createEmptyWorkspace } from '@wdtk/core/testing';

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

  it(`should generate required files`, async () => {
    const tree = await runSchematic({ name: 'test-app' });
    expect(tree.exists('/test-app/tsconfig.json'));
  });

  describe(`--unit-test-runner`, () => {
    describe(`jest (default)`, () => {
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

  describe(`--e2e-test-runner`, () => {
    describe(`cypress (default)`, () => {
      it(`should remove 'protractor' tsconfig from the 'lint' target`, async () => {
        const tree = await runSchematic({ name: 'test-app' });
        const project = await getProjectDefinition(tree, 'test-app');
        const lintTarget = project.targets.get('lint');
        const tsConfigPaths: string[] = <any>lintTarget.options.tsConfig;
        const protractorTsConfigExists = tsConfigPaths.some((tsConfigPath) => tsConfigPath.includes('e2e/tsconfig.json'));
        expect(protractorTsConfigExists).toBe(false);
      });
    });
    describe(`none`, () => {});
  });
});
