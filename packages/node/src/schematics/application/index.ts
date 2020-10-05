import { join, normalize, Path } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { ProjectDefinition } from '@wdtk/core';
import { normalizeProjectName, normalizePackageName, offsetFromRoot } from '@wdtk/core';
import { getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';

import { strings } from '@wdtk/core/util';

import { Schema } from './schema';

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
    ]);
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
      prefix: opts.name,
    });

    configureBuildTarget(project, opts);
    configureServeTarget(project, opts);
    configureLintTarget(project, opts);
    workspace.extensions.defaultProject = workspace.extensions.defaultProject || opts.name;
  });
}

function setupUnitTestRunner(opts: ApplicationOptions): Rule {
  return noop();
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

function configureBuildTarget(project: ProjectDefinition, opts: ApplicationOptions) {
  project.targets.add({
    name: 'build',
    builder: '@wdtk/node:build',
    options: {},
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
      exclude: ['**/node_modules/**', `!${opts.projectRoot}/**/*`],
    },
  });
}
