import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getWorkspaceDefinition, readJsonInTree } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';

import { Schema as InitOptions, UnitTestRunner } from './schema';

const schematicCollection = '@wdtk/stencil';
const schematicName = 'init';

const defaultOpts: InitOptions = {};

describe('stencil init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should workspace dependencies required by stencil`, async () => {
    const tree = await runSchematic(defaultOpts);
    const { devDependencies } = readJsonInTree(tree, `/package.json`);
    expect(devDependencies['@wdtk/stencil']).toBeDefined();
  });

  it(`should add the @wdtk/stencil nature to workspace definition`, async () => {
    const tree = await runSchematic(defaultOpts);
    const workspace = await getWorkspaceDefinition(tree);
    expect(workspace.extensions.natures['@wdtk/stencil']).toEqual({ name: 'Stencil' });
  });

  it(`should set 'defaultPrefix' in the workspace definition to the default value`, async () => {
    const tree = await runSchematic({ ...defaultOpts });
    const workspace = await getWorkspaceDefinition(tree);
    expect(workspace.extensions.defaultPrefix).toEqual('app');
  });

  it(`should set 'defaultPrefix' in the workspace definition to the specified value`, async () => {
    const tree = await runSchematic({ ...defaultOpts, defaultPrefix: 'utp' });
    const workspace = await getWorkspaceDefinition(tree);
    expect(workspace.extensions.defaultPrefix).toEqual('utp');
  });

  describe(`--unitTestRunner`, () => {
    describe(`jest (default)`, () => {
      it(`should add 'jest' dependencies `, async () => {
        const tree = await runSchematic(defaultOpts);
        const { devDependencies } = readJsonInTree(tree, `/package.json`);
        expect(devDependencies['@wdtk/jest']).toBeDefined();
      });

      it(`should not add 'jest-preset-angular' dependency `, async () => {
        const tree = await runSchematic(defaultOpts);
        const { devDependencies } = readJsonInTree(tree, `/package.json`);
        expect(devDependencies['jest-preset-angular']).toBeUndefined();
      });
    });

    describe(`none`, () => {
      it(`should not add 'jest' dependencies`, async () => {
        const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.None });
        const { devDependencies } = readJsonInTree(tree, `/package.json`);
        expect(devDependencies['@wdtk/jest']).toBeUndefined();
      });
    });
  });
});
