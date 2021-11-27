import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { readJsonInTree } from '@wdtk/core';

import { versions } from './../../versions';
import { Schema as TypescriptOptions } from './schema';

describe('workspace schematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/workspace', require.resolve('../../collection.json'));
  const runSchematic = async (opts: TypescriptOptions): Promise<UnitTestTree> => {
    let tree = await schematicRunner.runSchematicAsync('workspace', { name: 'unitTest' }).toPromise();
    return schematicRunner.runSchematicAsync('typescript', opts, tree).toPromise();
  };

  const defaultOptions: TypescriptOptions = {};

  beforeEach(() => {});
  it('should create required files', async () => {
    const opts = { ...defaultOptions };
    const tree = await runSchematic(opts);
    const files = tree.files;
    expect(files).toContain('/tslint.json');
    expect(files).toContain('/tsconfig.json');
  });

  it('should have the latest version of typescript dependencies in package.json', async () => {
    const tree = await runSchematic(defaultOptions);
    const packageJson = readJsonInTree(tree, '/package.json');

    expect(packageJson.dependencies['tslib']).toBe(`${versions.TsLib}`);

    expect(packageJson.devDependencies['@types/node']).toBe(`${versions.NodeTypes}`);

    expect(packageJson.devDependencies['ts-node']).toBe(`${versions.TsNode}`);

    expect(packageJson.devDependencies['typescript']).toBe(`${versions.Typescript}`);
  });
});
