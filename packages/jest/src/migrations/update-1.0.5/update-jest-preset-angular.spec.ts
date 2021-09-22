import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { readJsonInTree } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';

const originalWorkspacePackageJson = {
  name: 'sample',
  devDependencies: {
    '@types/jest': '^26.0.14',
    jest: '^26.4.2',
    'jest-preset-angular': '8.3.1',
    'ts-jest': '^26.4.0',
  },
};

describe('jest update', () => {
  let schematicRunner = new SchematicTestRunner('test', require.resolve('../../migrations.json'));
  let tree: Tree;

  const runMigration = async (): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync('upgrade-jest-preset-angular-9', {}, tree).toPromise();
  };

  beforeEach(() => {
    tree = createEmptyWorkspace();
    tree.overwrite('package.json', JSON.stringify(originalWorkspacePackageJson));
  });

  it('should update dependencies', async () => {
    await runMigration();
    const { devDependencies } = readJsonInTree(tree, 'package.json');
    expect(devDependencies['jest']).toBeDefined();
    expect(devDependencies['jest']).toEqual('27.2.0');

    expect(devDependencies['jest-preset-angular']).toBeDefined();
    expect(devDependencies['jest-preset-angular']).toEqual('9.0.7');

    expect(devDependencies['@types/jest']).toBeDefined();
    expect(devDependencies['@types/jest']).toEqual('27.0.1');

    expect(devDependencies['ts-jest']).toBeDefined();
    expect(devDependencies['ts-jest']).toEqual('27.0.3');
  });
});
