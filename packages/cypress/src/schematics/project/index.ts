import { join, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, mergeWith, move, schematic, url } from '@angular-devkit/schematics';

import { updateWorkspaceDefinition, offsetFromRoot, getProjectDefinition, getWorkspaceDefinition, updateJsonInTree } from '@wdtk/core';
import { tags } from '@wdtk/core/util';

import { Schema } from './schema';

export interface ProjectOptions extends Schema {
  projectRoot: string;
}

export default function (opts: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('init', { ...opts }), //
      checkTestTargetDoesNotExist(opts),
      setupTsConfig(opts),
      setupWorkspaceDefinition(opts),
      generateFiles(opts),
    ]);
  };
}

function checkTestTargetDoesNotExist(opts: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    const project = await getProjectDefinition(tree, opts.project);
    if (project.targets.get('e2e')) {
      throw new SchematicsException(`The ${opts.project} already has a 'e2e' target.`);
    }
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
        tsConfig.references.push({ path: './tsconfig.e2e.json' });
      }
      return tsConfig;
    });
  };
}

function generateFiles(opts: ProjectOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return mergeWith(
      apply(url('./files'), [
        applyTemplates({
          ...opts,
          ext: 'ts',
          offsetFromRoot: offsetFromRoot(opts.projectRoot),
        }),
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
    const config = `${root}/cypress.json`;
    const e2eTsConfig = `${root}/tsconfig.e2e.json`;

    project.targets.add({
      name: 'e2e',
      builder: '@wdtk/cypress:cypress',
      options: {
        cypressConfig: config,
        tsConfig: e2eTsConfig,
        devServerTarget: `${opts.project}:serve`,
      },
      configurations: {
        production: {
          devServerTarget: `${opts.project}:serve:production`,
        },
      },
    });

    const lintTarget = project.targets.get('lint');
    if (lintTarget && lintTarget.options && Array.isArray(lintTarget.options.tsConfig)) {
      lintTarget.options.tsConfig = lintTarget.options.tsConfig.concat(e2eTsConfig);
    }
  });
}

async function normalizeOptions(tree: Tree, opts: ProjectOptions): Promise<ProjectOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const project = workspace.projects.get(opts.project);
  if (!project) {
    throw new SchematicsException(`Project name "${opts.project}" doesn't not exist.`);
  }
  const projectRoot = normalize(project.root);
  return {
    ...opts,
    projectRoot,
  };
}
