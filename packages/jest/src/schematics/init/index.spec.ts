import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

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
    const { devDependencies } = getJsonFileContent(tree, 'package.json');

    expect(devDependencies['jest']).toBeDefined();
    expect(devDependencies['@wdtk/jest']).toBeDefined();
    expect(devDependencies['@types/jest']).toBeDefined();
    expect(devDependencies['ts-jest']).toBeDefined();
    expect(devDependencies['jest-preset-angular']).toBeDefined();
  });

  it(`should generate the root jest configuration file`, async () => {
    const tree = await runSchematic(defaultOptions);
    expect(tree.exists('jest.config.js')).toBeTruthy();
  });

  it(`should not overwrite the root jest configuration file if it exist`, async () => {
    workspaceTree.create('jest.config.js', `test`);
    const tree = await runSchematic(defaultOptions);
    expect(tree.read('jest.config.js').toString()).toEqual('test');
  });

  describe('--babelJest', () => {
    it(`should add babel dependencies`, async () => {
      const tree = await runSchematic({ ...defaultOptions, babelJest: true });
      const { devDependencies } = getJsonFileContent(tree, 'package.json');
      expect(devDependencies['@babel/core']).toBeDefined();
      expect(devDependencies['@babel/preset-env']).toBeDefined();
      expect(devDependencies['@babel/preset-typescript']).toBeDefined();
      expect(devDependencies['@babel/preset-react']).toBeDefined();
      expect(devDependencies['babel-jest']).toBeDefined();
    });

    it(`should not add 'jest-preset-angular' dependency`, async () => {
      const tree = await runSchematic({ ...defaultOptions, babelJest: true });
      const { devDependencies } = getJsonFileContent(tree, 'package.json');

      expect(devDependencies['jest-preset-angular']).not.toBeDefined();
    });
  });

  describe('--support-tsx', () => {
    it(`should not add the 'jest-preset-angular' dependency`, async () => {
      const tree = await runSchematic({ ...defaultOptions, supportTsx: true });
      const { devDependencies } = getJsonFileContent(tree, 'package.json');

      expect(devDependencies['jest-preset-angular']).not.toBeDefined();
    });
  });
});
