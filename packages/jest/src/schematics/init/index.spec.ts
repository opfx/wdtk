import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { readJsonInTree } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';

import { extensionsRecommendations } from '../../constants';

import { Schema as InitOptions } from './schema';

const schematicCollection = '@wdtk/jest';
const schematicName = 'init';
const defaultOptions: InitOptions = {};
describe('jest init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;
  beforeEach(() => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should add 'jest' dependencies`, async () => {
    const tree = await runSchematic(defaultOptions);
    const { devDependencies } = readJsonInTree(tree, 'package.json');

    expect(devDependencies['jest']).toBeDefined();
    expect(devDependencies['@wdtk/jest']).toBeDefined();
    expect(devDependencies['@types/jest']).toBeDefined();
    expect(devDependencies['ts-jest']).toBeDefined();
    expect(devDependencies['jest-preset-angular']).toBeDefined();
  });

  it(`should generate the root jest configuration files`, async () => {
    const tree = await runSchematic(defaultOptions);
    expect(tree.exists('jest.config.js')).toBeTruthy();
    expect(tree.exists('jest.preset.js')).toBeTruthy();
  });

  it(`should not overwrite the root jest configuration file if it exist`, async () => {
    workspaceTree.create('jest.config.js', `test`);
    const tree = await runSchematic(defaultOptions);
    expect(tree.read('jest.config.js').toString()).toEqual('test');
  });

  it('should add the recommended extension if it does not exist', async () => {
    const tree = await runSchematic(defaultOptions);
    const { recommendations } = readJsonInTree(tree, '/.vscode/extensions.json');
    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations).toEqual(expect.arrayContaining(extensionsRecommendations));
  });

  it('should NOT add the recommended extension if it already exists', async () => {
    if (!workspaceTree.exists('/.vscode/extensions.json')) {
      workspaceTree.create(
        '/.vscode/extensions.json',
        JSON.stringify({
          recommendations: [],
        })
      );
    }
    workspaceTree.overwrite(
      '/.vscode/extensions.json',
      JSON.stringify({
        recommendations: extensionsRecommendations,
      })
    );
    const tree = await runSchematic(defaultOptions);
    const { recommendations } = readJsonInTree(tree, '/.vscode/extensions.json');

    expect(recommendations).toEqual(extensionsRecommendations);
  });

  describe('--babelJest', () => {
    it(`should add babel dependencies`, async () => {
      const tree = await runSchematic({ ...defaultOptions, babelJest: true });
      const { devDependencies } = readJsonInTree(tree, 'package.json');
      expect(devDependencies['@babel/core']).toBeDefined();
      expect(devDependencies['@babel/preset-env']).toBeDefined();
      expect(devDependencies['@babel/preset-typescript']).toBeDefined();
      expect(devDependencies['@babel/preset-react']).toBeDefined();
      expect(devDependencies['babel-jest']).toBeDefined();
    });

    it(`should not add 'jest-preset-angular' dependency`, async () => {
      const tree = await runSchematic({ ...defaultOptions, babelJest: true });
      const { devDependencies } = readJsonInTree(tree, 'package.json');

      expect(devDependencies['jest-preset-angular']).not.toBeDefined();
    });
  });

  describe('--support-tsx', () => {
    it(`should not add the 'jest-preset-angular' dependency`, async () => {
      const tree = await runSchematic({ ...defaultOptions, supportTsx: true });
      const { devDependencies } = readJsonInTree(tree, 'package.json');

      expect(devDependencies['jest-preset-angular']).not.toBeDefined();
    });
  });
});
