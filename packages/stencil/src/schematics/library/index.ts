import { join, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, externalSchematic, filter, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { addInstallTask, addProjectDependencies, formatFiles, offsetFromRoot, updateWorkspaceDefinition } from '@wdtk/core';
import { getWorkspaceDefinition } from '@wdtk/core';
import { normalizePackageName, normalizeProjectName, updateJsonInTree } from '@wdtk/core';
import { NodeDependency, NodeDependencyType, ProjectDefinition } from '@wdtk/core';
import { strings } from '@wdtk/core/util';

import { versions } from './../../versions';

import { Schema } from './schema';
import { UnitTestRunner } from './schema';

export const projectDependencies: NodeDependency[] = [
  // dependencies
  { name: '@stencil/core', type: NodeDependencyType.Default, version: versions.Stencil },
];

export interface LibraryOptions extends Schema {
  packageName: string;
  projectRoot: string;
}

export default function (opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('init', { ...opts, skipInstall: true, skipFormat: true }),
      generateFiles(opts),
      generateProjectDefinition(opts),
      addProjectDependencies(opts.name, projectDependencies),
      setupUnitTestRunner(opts),
      formatFiles(opts),
      addInstallTask(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: LibraryOptions): Promise<LibraryOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot || '';

  opts.name = normalizeProjectName(opts.name);
  const packageName = normalizePackageName(tree, opts.name);
  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  return {
    ...opts,
    projectRoot,
    packageName,
  };
}

function generateFiles(opts: LibraryOptions): Rule {
  return mergeWith(apply(url('./files'), [applyTemplates({ ...opts, dot: '.', offsetFromRoot: offsetFromRoot(opts.projectRoot) }), move(opts.projectRoot)]));
}

function generateProjectDefinition(opts: LibraryOptions): Rule {
  const normalizedProjectRoot = normalize(opts.projectRoot);
  return updateWorkspaceDefinition((workspace) => {
    const project = workspace.projects.add({
      name: opts.name,
      root: normalizedProjectRoot,
      sourceRoot: join(normalizedProjectRoot, 'src'),
      projectType: 'library',
      prefix: opts.prefix,
    });
    configureBuildTarget(project, opts);
    configureServeTarget(project, opts);
    workspace.extensions.defaultProject = workspace.extensions.defaultProject || opts.name;
  });
}

function configureBuildTarget(project: ProjectDefinition, opts: LibraryOptions) {
  project.targets.add({
    name: 'build',
    builder: '@wdtk/stencil:build',
    options: {
      // outputPath: join(normalize('dist'), opts.packageName),
      // main: join(normalize(project.sourceRoot), 'main.ts'),
      // tsConfig: join(normalize(opts.projectRoot), 'tsconfig.app.json'),
      // assets: [join(normalize(project.sourceRoot), 'assets')],
    },
    // configurations: {
    //   production: {
    //     optimization: true,
    //     extractLicenses: true,
    //     inspect: false,
    //     fileReplacements: [
    //       {
    //         replace: join(normalize(project.sourceRoot), 'environments/environment.ts'),
    //         with: join(normalize(project.sourceRoot), 'environments/environment.prod.ts'),
    //       },
    //     ],
    //   },
    // },
  });
}

function configureServeTarget(project: ProjectDefinition, opts: LibraryOptions) {
  project.targets.add({
    name: 'serve',
    builder: '@wdtk/node:execute',
    // options: {
    //   buildTarget: `${opts.name}:build`,
    // },
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
    supportTsx: true,
  });
}
