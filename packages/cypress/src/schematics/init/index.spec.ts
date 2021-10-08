import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { readJsonInTree } from '@wdtk/core';
import { versions } from './../../versions';
import { Schema as InitOptions } from './schema';

export function createEmptyWorkspace(): Tree {
  const tree = Tree.empty();
  tree.create(
    '/package.json',
    JSON.stringify({
      name: 'test-name',
      dependencies: {},
      devDependencies: {},
    })
  );
  return tree;
}

describe('cypress init schematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/cypress', require.resolve('../../collection.json'));
  const runSchematic = async (opts: InitOptions): Promise<UnitTestTree> => {
    let tree = createEmptyWorkspace();
    return schematicRunner.runSchematicAsync('init', opts, tree).toPromise();
  };

  const defaultOptions: InitOptions = {};

  beforeEach(() => {});

  it('should have the latest version of Cypress dependencies in package.json', async () => {
    const tree = await runSchematic(defaultOptions);
    const packageJson = readJsonInTree(tree, '/package.json');

    expect(packageJson.devDependencies['cypress']).toBe(`${versions.Cypress}`);
    expect(packageJson.devDependencies['@wdtk/cypress']).toBe(`${versions.Wdtk}`);
  });
});
