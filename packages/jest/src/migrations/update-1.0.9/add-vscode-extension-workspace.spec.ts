import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { readJsonInTree, getProjectDefinition, getWorkspaceDefinition, setWorkspaceDefinition } from '@wdtk/core';
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

  beforeEach(async () => {
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

  it('should remove "orta.vscode-jest" launch configurations', async () => {
    const workspace = await getWorkspaceDefinition(tree);
    workspace.projects.add({ name: 'project01', root: 'projects/project01' });
    workspace.projects.add({ name: 'project02', root: 'projects/project02' });
    await setWorkspaceDefinition(workspace, tree);
    // create a launch.json containing only the configuration we want to remove for project01
    tree.create(
      'projects/project01/.vscode/launch.json',
      JSON.stringify({
        version: '0.2.0',
        configurations: [
          {
            type: 'node',
            name: 'vscode-jest-tests',
            request: 'launch',
            program: '${workspaceFolder}/../../node_modules/jest/bin/jest',
            args: ['--runInBand'],
            cwd: '${workspaceFolder}',
            console: 'integratedTerminal',
            internalConsoleOptions: 'neverOpen',
            disableOptimisticBPs: true,
          },
        ],
      })
    );
    // create a launch.json several launch configurations
    // including the configuration we want to remove for project02
    tree.create(
      'projects/project02/.vscode/launch.json',
      JSON.stringify({
        version: '0.2.0',
        configurations: [
          {
            type: 'node',
            name: 'vscode-jest-tests',
            request: 'launch',
            program: '${workspaceFolder}/../../node_modules/jest/bin/jest',
            args: ['--runInBand'],
            cwd: '${workspaceFolder}',
            console: 'integratedTerminal',
            internalConsoleOptions: 'neverOpen',
            disableOptimisticBPs: true,
          },
          {
            type: 'node',
            name: 'sample',
            request: 'launch',
          },
        ],
      })
    );

    await runMigration();

    // after the migration project01 should have 0 launch configurations
    let content = readJsonInTree(tree, 'projects/project01/.vscode/launch.json');
    let configurations = content.configurations;
    expect(configurations.length).toEqual(0);

    // after the migration project02 should have 1 launch configuration
    content = readJsonInTree(tree, 'projects/project02/.vscode/launch.json');
    configurations = content.configurations;
    expect(configurations.length).toEqual(1);
  });
});
