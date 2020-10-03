import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getWorkspaceDefinition, updateWorkspaceDefinition, updateJsonInTree } from '@wdtk/core';

import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { ProjectOptions } from './index';

const schematicCollection = '@wdtk/cypress';
const schematicName = 'project';

describe(`cypress project schematic`, () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: Partial<ProjectOptions>): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
    // add test project
    workspaceTree = await schematicRunner
      .callRule(
        updateWorkspaceDefinition((workspace) => {
          workspace.projects.add({ name: 'test-project', root: 'test-project' });
        }),
        workspaceTree
      )
      .toPromise();
    // add the lint target (architect)
    workspaceTree = await schematicRunner
      .callRule(
        updateWorkspaceDefinition((workspace) => {
          const project = workspace.projects.get('test-project');
          project.targets.add({
            name: 'lint',
            builder: '@angular-devkit/build-angular:tslint',
            options: { tsConfig: [] },
          });
        }),
        workspaceTree
      )
      .toPromise();
    // add project's tsconfig
    workspaceTree = await schematicRunner
      .callRule(
        updateJsonInTree('test-project/tsconfig.json', (json) => {
          return {
            files: [],
            include: [],
            references: [],
          };
        }),
        workspaceTree
      )
      .toPromise();
  });

  it(`should generate required files by cypress`, async () => {
    const tree = await runSchematic({ project: 'test-project' });
    expect(tree.exists('test-project/cypress.json')).toBeTruthy();
    expect(tree.exists('test-project/e2e/tsconfig.json')).toBeTruthy();

    expect(tree.exists('test-project/e2e/integration/app.spec.ts')).toBeTruthy();
    expect(tree.exists('test-project/e2e/plugins/index.js')).toBeTruthy();
    expect(tree.exists('test-project/e2e/support/index.ts')).toBeTruthy();
    expect(tree.exists('test-project/e2e/support/app.po.ts')).toBeTruthy();
    expect(tree.exists('test-project/e2e/support/commands.ts')).toBeTruthy();
  });

  it(`should configure the parent's project 'e2e' target`, async () => {
    const tree = await runSchematic({ project: 'test-project' });
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get('test-project');
    const target = project.targets.get('e2e');
    expect(target.builder).toEqual('@wdtk/cypress:cypress');
    expect(target.options.cypressConfig).toEqual('test-project/cypress.json');
    expect(target.options.tsConfig).toEqual('test-project/e2e/tsconfig.json');
    expect(target.options.devServerTarget).toEqual('test-project:serve');
  });

  it(`should configure the parent's project 'lint' target`, async () => {
    const tree = await runSchematic({ project: 'test-project' });
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get('test-project');
    const target = project.targets.get('lint');
    expect(target.options.tsConfig).toContain('test-project/e2e/tsconfig.json');
  });

  it(`empty`, async () => {});
});
