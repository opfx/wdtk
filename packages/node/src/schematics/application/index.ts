import { join, normalize } from '@angular-devkit/core';
import { externalSchematic, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { formatFiles, ProjectDefinition } from '@wdtk/core';
import { normalizeProjectName, normalizePackageName, offsetFromRoot } from '@wdtk/core';
import { getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';

import { strings } from '@wdtk/core/util';

import { Schema } from './schema';
import { UnitTestRunner } from './schema';

export interface ApplicationOptions extends Schema {
  projectRoot: string;
  packageName: string;
}

export default function (opts: ApplicationOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('init', { ...opts, skipInstall: true, skipFormat: true }),
      generateFiles(opts),
      generateProjectDefinition(opts),
      setupUnitTestRunner(opts),
      formatFiles(opts),
      addTasks(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: ApplicationOptions): Promise<ApplicationOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot || '';

  opts.name = normalizeProjectName(opts.name);
  const packageName = normalizePackageName(tree, opts.name);

  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  return {
    ...opts,
    packageName,
    projectRoot,
  };
}

function generateFiles(opts: ApplicationOptions): Rule {
  return mergeWith(apply(url('./files'), [applyTemplates({ ...opts, offsetFromRoot: offsetFromRoot(opts.projectRoot) }), move(opts.projectRoot)]));
}

function generateProjectDefinition(opts: ApplicationOptions): Rule {
  return updateWorkspaceDefinition((workspace) => {
    const normalizedProjectRoot = normalize(opts.projectRoot);

    const project = workspace.projects.add({
      name: opts.name,
      root: normalizedProjectRoot,
      sourceRoot: join(normalizedProjectRoot, 'src'),
      projectType: 'application',
      // prefix: opts.name,
    });

    configureBuildTarget(project, opts);
    configureServeTarget(project, opts);
    configureLintTarget(project, opts);
    workspace.extensions.defaultProject = workspace.extensions.defaultProject || opts.name;
  });
}

function configureBuildTarget(project: ProjectDefinition, opts: ApplicationOptions) {
  project.targets.add({
    name: 'build',
    builder: '@wdtk/node:build',
    options: {
      outputPath: join(normalize('dist'), opts.packageName),
      main: join(normalize(project.sourceRoot), 'main.ts'),
      tsConfig: join(normalize(opts.projectRoot), 'tsconfig.app.json'),
      assets: [join(normalize(project.sourceRoot), 'assets')],
    },
    configurations: {
      production: {
        optimization: true,
        extractLicenses: true,
        inspect: false,
        fileReplacements: [
          {
            replace: join(normalize(project.sourceRoot), 'environments/environment.ts'),
            with: join(normalize(project.sourceRoot), 'environments/environment.prod.ts'),
          },
        ],
      },
    },
  });
}

function configureServeTarget(project: ProjectDefinition, opts: ApplicationOptions) {
  project.targets.add({
    name: 'serve',
    builder: '@wdtk/node:execute',
    options: {
      buildTarget: `${opts.name}:build`,
    },
  });
}

function configureLintTarget(project: ProjectDefinition, opts: ApplicationOptions) {
  const tsConfigPath = `${opts.projectRoot}/tsconfig.app.json`;
  project.targets.add({
    name: 'lint',
    builder: '@angular-devkit/build-angular:tslint',
    options: {
      tsConfig: [tsConfigPath],
      // exclude: ['**/node_modules/**', `!${opts.projectRoot}/**/*`],
      exclude: ['**/node_modules/**'],
    },
  });
}

function setupUnitTestRunner(opts: ApplicationOptions): Rule {
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

function addTasks(opts: ApplicationOptions): Rule {
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
