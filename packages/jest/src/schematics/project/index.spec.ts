import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getWorkspaceDefinition, readJsonInTree, updateWorkspaceDefinition, updateJsonInTree } from '@wdtk/core';

import { createEmptyWorkspace } from '@wdtk/core/testing';

import { Schema as ProjectOptions, SetupFile } from './schema';

const schematicCollection = '@wdtk/jest';
const schematicName = 'project';

describe(`jest project schematic`, () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: ProjectOptions): Promise<UnitTestTree> => {
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

  it(`should generate files`, async () => {
    const tree = await runSchematic({ project: 'test-project', setupFile: SetupFile.Angular });
    expect(tree.exists('test-project/src/test-setup.ts')).toBeTruthy();
    expect(tree.exists('test-project/jest.config.js')).toBeTruthy();
    expect(tree.exists('test-project/tsconfig.spec.json')).toBeTruthy();
  });

  it(`should configure the parent's project 'test' target`, async () => {
    const tree = await runSchematic({ project: 'test-project', setupFile: SetupFile.Angular });
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get('test-project');
    const target = project.targets.get('test');
    expect(target.builder).toEqual('@wdtk/jest:jest');
    expect(target.options.jestConfig).toEqual('test-project/jest.config.js');
    expect(target.options.passWithNoTests).toBe(true);
  });

  it(`should not configure the parent's project 'test' target with deprecated options`, async () => {
    const tree = await runSchematic({ project: 'test-project', setupFile: SetupFile.Angular });
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get('test-project');
    const target = project.targets.get('test');
    expect(target.options.setupFile).toBeUndefined();
    expect(target.options.tsConfig).toBeUndefined();
  });

  it(`should configure the parent's project 'lint' target`, async () => {
    const tree = await runSchematic({ project: 'test-project', setupFile: SetupFile.Angular });
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get('test-project');
    const target = project.targets.get('lint');
    expect(target.options.tsConfig).toContain('test-project/tsconfig.spec.json');
  });

  it(`should create a valid 'jest.config.js' file`, async () => {
    const tree = await runSchematic({ project: 'test-project' });
    const jestConfigContent = tree.readContent('test-project/jest.config.js');
    expect(jestConfigContent.replace(/[ \t\r]+/g, '')).toBe(
      `require('jest-preset-angular/ngcc-jest-processor');
      
      module.exports = {
      displayName: 'test-project',
      preset: '../jest.preset.js',
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/tsconfig.spec.json',
        }
      },
      coverageDirectory: '../coverage/test-project',
      transform: {
        '^.+\\\\.(ts|js|html)$': 'jest-preset-angular'
      },
      snapshotSerializers: [
        'jest-preset-angular/build/serializers/no-ng-attributes',
        'jest-preset-angular/build/serializers/ng-snapshot',
        'jest-preset-angular/build/serializers/html-comment',
      ],
      testPathIgnorePatterns: ['/node_modules/', '/e2e/']
    };`.replace(/[ \t\r]+/g, '')
    );
  });
});
