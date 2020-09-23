import { join, normalize } from '@angular-devkit/core';

import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, filter, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { updateJsonInTree, offsetFromRoot, getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';
import { getProjectDefinition } from '@wdtk/core';
import { tags } from '@wdtk/core/util';
import ts = require('typescript');
import { Schema } from './schema';

export interface ProjectOptions extends Schema {
  root: string;
}

export default function (opts: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('init', opts), //
      checkTestTargetDoesNotExist(opts),
      generateFiles(opts),
      setupTsConfig(opts),
      setupWorkspaceDefinition(opts),
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

function setupTsConfig(opts: ProjectOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    const tsProjectConfigFile = join(normalize(opts.root), 'tsconfig.json');
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
    // return updateJsonInTree(tsProjectConfigFile, (tsConfig) => {
    //   const oldTypes = tsConfig.compilerOptions.types || [];
    //   const newTypes = new Set([...oldTypes, 'node', 'jest']);
    //   const types = Array.from(newTypes);
    //   return {
    //     ...tsConfig,
    //     compilerOptions: {
    //       ...tsConfig.compilerOptions,
    //       types,
    //     },
    //   };
    // });
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
          offsetFromRoot: offsetFromRoot(opts.root),
        }),
        opts.setupFile === 'none' ? filter((file) => file !== '/src/test-setup.ts') : noop(),
        opts.babelJest ? noop() : filter((file) => file !== '/babel-jest.config.json'),
        move(opts.root),
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
  const root = normalize(project.root);
  return {
    ...opts,
    root,
  };
}
