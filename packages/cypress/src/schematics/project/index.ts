import { normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, mergeWith, move, url } from '@angular-devkit/schematics';

import { updateWorkspaceDefinition, offsetFromRoot, getWorkspaceDefinition } from '@wdtk/core';

import { Schema } from './schema';

interface ProjectOptions extends Schema {
  root: string;
}

export default function (options: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    options = await normalizeOptions(tree, options);
    return chain([setupWorkspaceDefinition(options), generateFiles(options)]);
  };
}

function generateFiles(opts: ProjectOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return mergeWith(
      apply(url('./files'), [
        applyTemplates({
          ...opts,
          offsetFromRoot: offsetFromRoot(opts.root),
        }),
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
    const config = `${root}/cypress.json`;
    const e2eTsConfig = `${root}/tsconfig.e2e.json`;

    project.targets.add({
      name: 'e2e',
      builder: '@wdtk/cypress:cypress',
      options: {
        config: config,
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
  const root = normalize(project.root);
  return {
    ...opts,
    root,
  };
}
