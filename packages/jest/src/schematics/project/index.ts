import { join, normalize } from '@angular-devkit/core';

import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, filter, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { updateJsonInTree, offsetFromRoot, getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';
import { getProjectDefinition } from '@wdtk/core';
import { addProjectDependencies, NodeDependency, NodeDependencyType } from '@wdtk/core';
import { tags } from '@wdtk/core/util';

import { Schema } from './schema';

import { addPropertyToJestConfig } from './../../util/config';

export interface ProjectOptions extends Schema {
  projectRoot: string;
}

const projectDependencies: NodeDependency[] = [{ type: NodeDependencyType.Dev, name: 'jest', version: '*' }];

export default function (opts: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`▶ Running '@wdtk/jest:project' schematic`);
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('init', opts), //
      checkTestTargetDoesNotExist(opts),

      generateFiles(opts),
      setupPackageJson(opts),
      setupLaunchConfig(opts),
      setupTsConfig(opts),
      setupWorkspaceDefinition(opts),
      setupWorkspaceJestConfig(opts),
    ]);
  };
}

function checkTestTargetDoesNotExist(opts: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    const project = await getProjectDefinition(tree, opts.project);
    if (project.targets.get('test')) {
      throw new SchematicsException(`The ${opts.project} already has a 'test' target.`);
    }
  };
}

/**
 * Adds the required dependencies and scripts to project's package.json
 *
 * @param opts
 */
function setupPackageJson(opts: ProjectOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return chain([
      addProjectDependencies(opts.project, projectDependencies),
      updateJsonInTree(join(normalize(opts.projectRoot), 'package.json'), (packageJson) => {
        if (!packageJson.scripts) {
          packageJson.scripts = {};
        }
        packageJson.scripts = {
          ...packageJson.scripts,
          test: 'yarn jest',
        };
        return packageJson;
      }),
    ]);
  };
}

/**
 * Adds the vscode jest launch configuration to the project's .vscode/launch.json
 *
 * @param opts
 */
function setupLaunchConfig(opts: ProjectOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(` ∙ adding vscode jest launch configuration`);
    const launchConfigFile = join(normalize(opts.projectRoot), '.vscode', 'launch.json');
    if (!tree.exists(launchConfigFile)) {
      throw new SchematicsException(tags.stripIndents`
      Failed to locate ${launchConfigFile}. Please create it.
      `);
    }
    return updateJsonInTree(launchConfigFile, (launch) => {
      const offset = offsetFromRoot(opts.projectRoot);
      const launchConfig = {
        type: 'node',
        name: 'vscode-jest-tests',
        request: 'launch',
        program: `\${workspaceFolder}/${offset}/node_modules/jest/bin/jest`,
        args: ['--runInBand'],
        cwd: '${workspaceFolder}',
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
        disableOptimisticBPs: true,
      };

      // make sure we have the configurations array
      if (launch.configurations === undefined) {
        launch.configurations = [];
      }

      // bail out if a vscode jest configuration exists already
      for (let configuration of launch.configurations) {
        if (configuration.name === 'vscode-jest-tests') {
          return launch;
        }
      }
      launch.configurations.push(launchConfig);
      return launch;
    });
  };
}

function setupTsConfig(opts: ProjectOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    const tsProjectConfigFile = join(normalize(opts.projectRoot), 'tsconfig.json');
    if (!tree.exists(tsProjectConfigFile)) {
      throw new SchematicsException(tags.stripIndents`
      Failed to locate ${tsProjectConfigFile}. Please create it.
      `);
    }
    return updateJsonInTree(tsProjectConfigFile, (tsConfig) => {
      if (tsConfig.references) {
        tsConfig.references.push({ path: './tsconfig.spec.json' });
      }
      return tsConfig;
    });
  };
}

function setupWorkspaceJestConfig(opts: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    const project = await getProjectDefinition(tree, opts.project);
    addPropertyToJestConfig(tree, 'jest.config.js', 'projects', `<rootDir>/${project.root}`);
  };
}

function generateFiles(opts: ProjectOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return mergeWith(
      apply(url('./files'), [
        applyTemplates({
          dot: '.',
          ...opts,
          transformer: opts.babelJest ? 'babel-jest' : 'ts-jest',
          offsetFromRoot: offsetFromRoot(opts.projectRoot),
        }),
        // do not create package.json and /.vscode/launch.json files if they exist already
        tree.exists(join(normalize(opts.projectRoot), 'package.json')) ? filter((file) => file !== '/package.json') : noop(),
        tree.exists(join(normalize(opts.projectRoot), '/.vscode/launch.json')) ? filter((file) => file !== './vscode/launch.json') : noop(),
        opts.setupFile === 'none' ? filter((file) => file !== '/src/test-setup.ts') : noop(),
        opts.babelJest ? noop() : filter((file) => file !== '/babel-jest.config.json'),
        move(opts.projectRoot),
      ])
    );
  };
}

function setupWorkspaceDefinition(opts: ProjectOptions): Rule {
  return updateWorkspaceDefinition((workspace) => {
    const project = workspace.projects.get(opts.project);
    if (!project) {
      throw new SchematicsException(`Project name "${opts.project}" doesn't not exist.`);
    }
    const root = normalize(project.root);
    const config = join(root, 'jest.config.js');
    const specTsConfig = join(root, 'tsconfig.spec.json');
    const setupFile = join(root, 'src/test-setup.ts');

    const options: any = {
      jestConfig: config,
      tsConfig: specTsConfig,
      passWithNoTests: true,
    };
    if (opts.setupFile !== 'none') {
      options.setupFile = setupFile;
    }
    project.targets.add({
      name: 'test',
      builder: '@wdtk/jest:jest',
      options,
    });

    const lintTarget = project.targets.get('lint');
    if (lintTarget && lintTarget.options && Array.isArray(lintTarget.options.tsConfig)) {
      lintTarget.options.tsConfig = lintTarget.options.tsConfig.concat(specTsConfig);
    }
  });
}

async function normalizeOptions(tree: Tree, opts: ProjectOptions): Promise<ProjectOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const project = workspace.projects.get(opts.project);
  if (!project) {
    throw new SchematicsException(`Project name "${opts.project}" doesn't not exist.`);
  }
  if (opts.testEnvironment === 'jsdom') {
    (opts as any).testEnvironment = '';
  }

  // if we support TSX or babelJest we don't support angular(html templates)
  if (opts.supportTsx || opts.babelJest) {
    opts.skipSerializers = true;
  }
  const projectRoot = normalize(project.root);
  return {
    ...opts,
    projectRoot,
  };
}
