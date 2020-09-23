import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';

import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { ProjectOptions } from './index';

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
  });

  it(`should generate files`, async () => {
    const tree = await runSchematic({ project: 'test-project', setupFile: 'angular' } as any);
    expect(tree.exists('test-project/src/test-setup.ts')).toBeTruthy();
    expect(tree.exists('test-project/jest.config.js')).toBeTruthy();
    expect(tree.exists('test-project/tsconfig.spec.json')).toBeTruthy();
  });

  it(`should configure the parent's project 'test' target`, async () => {
    const tree = await runSchematic({ project: 'test-project', setupFile: 'angular' } as any);
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get('test-project');
    const target = project.targets.get('test');
    expect(target.builder).toEqual('@wdtk/jest:jest');
    expect(target.options.jestConfig).toEqual('test-project/jest.config.js');
    expect(target.options.setupFile).toEqual('test-project/src/test-setup.ts');
    expect(target.options.tsConfig).toEqual('test-project/tsconfig.spec.json');
    expect(target.options.passWithNoTests).toBe(true);
  });

  it(`should configure the parent's project 'lint' target`, async () => {
    const tree = await runSchematic({ project: 'test-project', setupFile: 'angular' } as any);
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get('test-project');
    const target = project.targets.get('lint');
    expect(target.options.tsConfig).toContain('test-project/tsconfig.spec.json');
  });

  it(`should create a valid 'jest.config.js' file`, async () => {
    const tree = await runSchematic({ project: 'test-project' } as any);
    const jestConfigContent = tree.readContent('test-project/jest.config.js');
    expect(jestConfigContent.replace(/[ \t\r]+/g, '')).toBe(
      `module.exports = {
      name: 'test-project',
      preset: '../jest.config.js',
      globals: {
        'ts-jest': {
          tsConfig: '<rootDir>/tsconfig.spec.json',
        }
      },
      coverageDirectory: '../coverage/test-project',
      snapshotSerializers: [
        'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
        'jest-preset-angular/build/AngularSnapshotSerializer.js',
        'jest-preset-angular/build/HTMLCommentSerializer.js'
      ],
      testPathIgnorePatterns: ['/e2e/']
    };`.replace(/[ \t\r]+/g, '')
    );
  });
});
