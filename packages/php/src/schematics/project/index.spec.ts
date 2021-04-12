import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

import { createEmptyWorkspace } from '@wdtk/core/testing';

import { Schema as ProjectOptions, ProjectType } from './schema';

const schematicCollection = '@wdtk/php';
const schematicName = 'project';

const defaultOptions: ProjectOptions = {
  name: 'bar',
  projectRoot: 'projects/bar',
  projectType: ProjectType.Application,
};

describe('php project schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: ProjectOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(() => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should create project's vscode workspace file`, async () => {
    const tree = await runSchematic(defaultOptions);
    expect(tree.exists(`/${defaultOptions.projectRoot}/${defaultOptions.name}.code-workspace`)).toBeTruthy();
  });
});
