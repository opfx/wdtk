import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getWorkspaceDefinition, getProjectDefinition } from '@wdtk/core';
import { createEmptyWorkspace, getJsonFileContent } from '@wdtk/core/testing';

import { Schema as LibraryOptions } from './schema';
import { E2ETestRunner } from './schema';
import { UnitTestRunner } from './schema';
import { Style } from './schema';

const schematicCollection = '@wdtk/stencil';
const schematicName = 'library';

const defaultOpts: LibraryOptions = {
  name: 'stencil-lib',
};

describe('stencil init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: LibraryOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();
  });

  it(`should generate the files required by the stencil library project`, async () => {
    const tree = await runSchematic(defaultOpts);
    expect(tree.exists(`/${defaultOpts.name}/package.json`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/tsconfig.json`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/stencil.config.ts`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/.gitignore`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/src/index.ts`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/src/index.html`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.name}/src/components.d.ts`)).toBeTruthy();
  });

  it(`should project dependencies required by stencil`, async () => {
    const tree = await runSchematic(defaultOpts);
    const { dependencies } = getJsonFileContent(tree, `/${defaultOpts.name}/package.json`);
    expect(dependencies['@stencil/core']).toBeDefined();
  });

  it(`should generate a project definition for the stencil library`, async () => {
    const tree = await runSchematic(defaultOpts);
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get(defaultOpts.name);
    expect(project).toBeDefined();
    expect(project.extensions.projectType).toEqual('library');
    expect(project.root).toEqual(`/${defaultOpts.name}`);
    expect(project.sourceRoot).toEqual(`/${defaultOpts.name}/src`);
    expect(project.prefix).toEqual('app');
  });

  it(`set the 'prefix' in the project definition to the specified value`, async () => {
    const tree = await runSchematic({ ...defaultOpts, prefix: 'utp' });
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get(defaultOpts.name);
    expect(project).toBeDefined();

    expect(project.prefix).toEqual('utp');
  });

  describe(`--style`, () => {
    describe(`sass (default)`, () => {
      it(`should configure the @wdtk/stencil:component schematic to use sass`, async () => {
        const tree = await runSchematic(defaultOpts);
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const schematic = project.extensions.schematics['@wdtk/stencil:component'];
        expect(schematic).toBeDefined();
        expect(schematic.style).toEqual(Style.Sass);
      });
    });

    describe(`sass (default)`, () => {
      it(`should not configure the @wdtk/stencil:component schematic to use sass`, async () => {
        const tree = await runSchematic({ ...defaultOpts, style: Style.Css });
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const schematic = project.extensions.schematics['@wdtk/stencil:component'];
        expect(schematic).toBeUndefined();
      });
    });
  });

  describe(`--unitTestRunner`, () => {
    describe(`jest (default)`, () => {
      it(`should generate a test target in the project definition`, async () => {
        const tree = await runSchematic(defaultOpts);
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const target = project.targets.get('test');
        expect(target).toBeDefined();
      });

      it(`should configure the test target to use @wdtk/stencil:test builder `, async () => {
        const tree = await runSchematic(defaultOpts);
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const target = project.targets.get('test');
        expect(target).toBeDefined();
        expect(target.builder).toEqual('@wdtk/stencil:test');
      });
    });

    describe(`none`, () => {
      it(`should not generate a test target in the project definition`, async () => {
        const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.None });
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const target = project.targets.get('test');

        expect(target).toBeUndefined();
        // expect(tree.exists('jest.config.js')).toEqual(false);
      });

      it(`should configure the @wdtk/stencil:component schematic to skip unit tests`, async () => {
        const tree = await runSchematic({ ...defaultOpts, unitTestRunner: UnitTestRunner.None });
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const schematic = project.extensions.schematics['@wdtk/stencil:component'];
        expect(schematic).toBeDefined();
        expect(schematic.unitTestRunner).toEqual(UnitTestRunner.None);
      });
    });
  });

  describe(`--e2eTestRunner`, () => {
    describe(`puppeteer (default)`, () => {
      it(`should generate a e2e target in the project definition`, async () => {
        const tree = await runSchematic(defaultOpts);
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const target = project.targets.get('e2e');

        expect(target).toBeDefined();
      });
    });

    describe(`none`, () => {
      it(`should not generate a e2e target in the project definition`, async () => {
        const tree = await runSchematic({ ...defaultOpts, e2eTestRunner: E2ETestRunner.None });
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const target = project.targets.get('e2e');

        expect(target).toBeUndefined();
      });

      it(`should configure the @wdtk/stencil:component schematic to skip e2e tests`, async () => {
        const tree = await runSchematic({ ...defaultOpts, e2eTestRunner: E2ETestRunner.None });
        const project = await getProjectDefinition(tree, defaultOpts.name);
        const schematic = project.extensions.schematics['@wdtk/stencil:component'];
        expect(schematic).toBeDefined();
        expect(schematic.e2eTestRunner).toEqual(E2ETestRunner.None);
      });
    });
  });
});
