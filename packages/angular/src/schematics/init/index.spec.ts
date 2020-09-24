import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';

import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { Schema as InitOptions } from './schema';

const schematicCollection = '@wdtk/angular';
const schematicName = 'init';

describe('init', () => {
  const defaultOptions: InitOptions = {
    e2eTestRunner: 'none',
    unitTestRunner: 'none',
  } as any;

  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;
  beforeEach(() => {
    workspaceTree = createEmptyWorkspace();
  });

  it('should add angular dependencies', async () => {
    const tree = await runSchematic(defaultOptions);
    const { dependencies, devDependencies } = getJsonFileContent(tree, 'package.json');

    expect(dependencies['@angular/animations']).toBeDefined();
    expect(dependencies['@angular/common']).toBeDefined();
    expect(dependencies['@angular/compiler']).toBeDefined();
    expect(dependencies['@angular/core']).toBeDefined();
    expect(dependencies['@angular/platform-browser']).toBeDefined();
    expect(dependencies['@angular/platform-browser-dynamic']).toBeDefined();
    expect(dependencies['@angular/router']).toBeDefined();
    expect(dependencies['rxjs']).toBeDefined();
    expect(dependencies['zone.js']).toBeDefined();

    expect(devDependencies['@angular/compiler-cli']).toBeDefined();
    expect(devDependencies['@angular/language-service']).toBeDefined();
    expect(devDependencies['@angular-devkit/build-angular']).toBeDefined();
  });

  it(`should set the default prefix if it is not set`, async () => {
    const tree = await runSchematic({ ...defaultOptions, defaultPrefix: 'tp' });
    const workspace = await getWorkspaceDefinition(tree);
    expect(workspace.extensions.defaultPrefix).toEqual('tp');
  });

  it(`should set the default prefix if it is set to an empty string`, async () => {
    workspaceTree = await schematicRunner
      .callRule(
        updateWorkspaceDefinition((workspace) => {
          workspace.extensions.defaultPrefix = '';
        }),
        workspaceTree
      )
      .toPromise();

    const tree = await runSchematic({ ...defaultOptions, defaultPrefix: 'tp' });
    const workspace = await getWorkspaceDefinition(tree);
    expect(workspace.extensions.defaultPrefix).toEqual('tp');
  });

  it(`should not overwrite the default prefix if it is already set`, async () => {
    workspaceTree = await schematicRunner
      .callRule(
        updateWorkspaceDefinition((workspace) => {
          workspace.extensions.defaultPrefix = 'app';
        }),
        workspaceTree
      )
      .toPromise();
    let tree = await runSchematic({ ...defaultOptions, defaultPrefix: 'tp' });
    let workspace = await getWorkspaceDefinition(tree);
    expect(workspace.extensions.defaultPrefix).toEqual('app');
  });

  describe('e2e test runner', () => {
    describe('cypress', () => {
      it('should not add `protractor` dependencies', async () => {
        const tree = await runSchematic({ ...defaultOptions, e2eTestRunner: 'cypress' } as any);
        const { devDependencies } = getJsonFileContent(tree, 'package.json');

        expect(devDependencies['protractor']).not.toBeDefined();
        expect(devDependencies['jasmine-core']).not.toBeDefined();
        expect(devDependencies['jasmine-spec-reporter']).not.toBeDefined();
        expect(devDependencies['@types/jasmine']).not.toBeDefined();
        expect(devDependencies['@types/jasminewd2']).not.toBeDefined();
      });
    }),
      describe('protractor', () => {
        it('should add `protractor` dependencies', async () => {
          const tree = await runSchematic({ ...defaultOptions, e2eTestRunner: 'protractor' } as any);
          const { devDependencies } = getJsonFileContent(tree, 'package.json');

          expect(devDependencies['protractor']).toBeDefined();
          expect(devDependencies['jasmine-core']).toBeDefined();
          expect(devDependencies['jasmine-spec-reporter']).toBeDefined();
          expect(devDependencies['@types/jasmine']).toBeDefined();
          expect(devDependencies['@types/jasminewd2']).toBeDefined();
        });
      });
  });

  describe('unit test runner', () => {
    describe('karma', () => {
      it('should add `karma` dependencies', async () => {
        const tree = await runSchematic({ ...defaultOptions, unitTestRunner: 'karma' } as any);
        const { devDependencies } = getJsonFileContent(tree, 'package.json');

        expect(devDependencies['karma']).toBeDefined();
        expect(devDependencies['karma-chrome-launcher']).toBeDefined();
        expect(devDependencies['karma-coverage-istanbul-reporter']).toBeDefined();
        expect(devDependencies['karma-jasmine']).toBeDefined();
        expect(devDependencies['karma-jasmine-html-reporter']).toBeDefined();
        expect(devDependencies['jasmine-core']).toBeDefined();
        expect(devDependencies['jasmine-spec-reporter']).toBeDefined();
        expect(devDependencies['@types/jasmine']).toBeDefined();
      });
    });
  });
});
