import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { readJsonInTree } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';

import { extensionsRecommendations } from '../../constants';

const vscodeRecommendationsConfig = {
  recommendations: [],
};
describe('add vscode extension to workspace', () => {
  let schematicRunner = new SchematicTestRunner('test', require.resolve('../../migrations.json'));
  let tree: Tree;

  const runMigration = async (): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync('add-vscode-extension-workspace', {}, tree).toPromise();
  };

  beforeEach(() => {
    tree = createEmptyWorkspace();
    tree.create('/.vscode/extensions.json', JSON.stringify(vscodeRecommendationsConfig));
  });

  it('should add the recommended extension if it does not exist', async () => {
    await runMigration();
    const { recommendations } = readJsonInTree(tree, '/.vscode/extensions.json');
    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations).toEqual(expect.arrayContaining(extensionsRecommendations));
  });

  it('should NOT add the recommended extension if it already exists', async () => {
    tree.overwrite(
      '/.vscode/extensions.json',
      JSON.stringify({
        recommendations: extensionsRecommendations,
      })
    );
    await runMigration();
    const { recommendations } = readJsonInTree(tree, '/.vscode/extensions.json');

    expect(recommendations).toEqual(extensionsRecommendations);
  });
});
