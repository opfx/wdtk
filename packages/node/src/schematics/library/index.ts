import { join, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, externalSchematic, filter, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { formatFiles, getWorkspaceDefinition, offsetFromRoot, updateWorkspaceDefinition } from '@wdtk/core';
import { normalizePackageName, normalizeProjectName, updateJsonInTree } from '@wdtk/core';
import { ProjectDefinition } from '@wdtk/core';

import { strings } from '@wdtk/core/util';

import { Schema } from './schema';
import { UnitTestRunner } from './schema';

export interface LibraryOptions extends Schema {
  projectRoot: string;
  packageName: string;
  entryFile: string;
}

export default function (opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('init', { ...opts, skipInstall: true, skipFormat: true }),
      generateFiles(opts),
      generateProjectDefinition(opts),
      setupUnitTestRunner(opts),
      setupWorkspaceTsConfig(opts),
      formatFiles(opts),
      addTasks(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: LibraryOptions): Promise<LibraryOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot || '';

  opts.name = normalizeProjectName(opts.name);
  const packageName = normalizePackageName(tree, opts.name);

  const entryFile = 'index';
  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  return {
    ...opts,
    packageName,
    projectRoot,
    entryFile,
  };
}

function generateFiles(opts: LibraryOptions): Rule {
  const fileName = opts.name;
  const propertyName = strings.camelize(opts.name);
  return mergeWith(
    apply(url('./files'), [
      applyTemplates({ ...opts, fileName, propertyName, offsetFromRoot: offsetFromRoot(opts.projectRoot) }),
      opts.unitTestRunner === UnitTestRunner.None ? filter((file) => !file.endsWith('.spec.ts')) : noop(),
      move(opts.projectRoot),
    ])
  );
}

function generateProjectDefinition(opts: LibraryOptions): Rule {
  return updateWorkspaceDefinition((workspace) => {
    const normalizedProjectRoot = normalize(opts.projectRoot);

    const project = workspace.projects.add({
      name: opts.name,
      root: normalizedProjectRoot,
      sourceRoot: join(normalizedProjectRoot, 'src'),
      projectType: 'library',
    });

    // configureBuildTarget(project, opts);
    // configureServeTarget(project, opts);
    configureLintTarget(project, opts);
    workspace.extensions.defaultProject = workspace.extensions.defaultProject || opts.name;
  });
}

function configureLintTarget(project: ProjectDefinition, opts: LibraryOptions) {
  const tsConfigPath = `${opts.projectRoot}/tsconfig.lib.json`;
  project.targets.add({
    name: 'lint',
    builder: '@angular-devkit/build-angular:tslint',
    options: {
      tsConfig: [tsConfigPath],
      exclude: ['**/node_modules/**'],
    },
  });
}

function setupUnitTestRunner(opts: LibraryOptions): Rule {
  if (opts.unitTestRunner === UnitTestRunner.None) {
    return noop();
  }
  return externalSchematic('@wdtk/jest', 'project', {
    project: opts.name,
    setupFile: 'none',
    skipSerializers: true,
    babelJest: opts.babelJest,
  });
}

function setupWorkspaceTsConfig(opts: LibraryOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    if (!tree.exists('tsconfig.json')) {
      return tree;
    }
    return updateJsonInTree('tsconfig.json', (tsConfig) => {
      if (!tsConfig.compilerOptions.paths) {
        tsConfig.compilerOptions.paths = {};
      }
      if (!tsConfig.compilerOptions.paths[opts.packageName]) {
        tsConfig.compilerOptions.paths[opts.packageName] = [];
      }
      tsConfig.compilerOptions.paths[opts.packageName].push(`${opts.projectRoot}/src/${opts.entryFile}.ts`);
    });
  };
}

function addTasks(opts: LibraryOptions): Rule {
  if (opts.skipInstall) {
    return noop();
  }
  return async (tree: Tree, ctx: SchematicContext) => {
    let packageManager = 'yarn';
    const workspace = await getWorkspaceDefinition(tree);
    if (workspace.extensions.cli && workspace.extensions.cli['packageManager']) {
      packageManager = workspace.extensions.cli['packageManager'];
    }
    ctx.addTask(new NodePackageInstallTask({ packageManager }));
  };
}
