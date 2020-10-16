import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, noop } from '@angular-devkit/schematics';

import { NodeDependency, NodeDependencyType } from '@wdtk/core';
import { addInstallTask, addWorkspaceDependencies, getWorkspaceDefinition, formatFiles, updateWorkspaceDefinition } from '@wdtk/core';

import { Schema } from './schema';
import { UnitTestRunner } from './schema';

import { versions } from './../../versions';

export const workspaceDependencies: NodeDependency[] = [
  // dev dependencies
  { name: '@wdtk/stencil', type: NodeDependencyType.Dev, version: versions.Wdtk },
  // npm install --save-dev @types/puppeteer@3.0.1 puppeteer@5.2.1
];

export interface InitOptions extends Schema {}

export default function (opts: InitOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    ctx.logger.debug(`executing @wdtk/stencil:init`);
    return chain([
      externalSchematic('@wdtk/workspace', 'typescript', { skipInstall: true }), //
      opts.unitTestRunner === UnitTestRunner.Jest ? externalSchematic('@wdtk/jest', 'init', { ...opts, supportTsx: true }) : noop(),
      setupWorkspaceDefinition(opts),
      addWorkspaceDependencies(workspaceDependencies),
      formatFiles(opts),
      addInstallTask(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: InitOptions): Promise<InitOptions> {
  const workspace = await getWorkspaceDefinition(tree);

  return {
    ...opts,
  };
}

function setupWorkspaceDefinition(opts: InitOptions): Rule {
  return updateWorkspaceDefinition((workspace) => {
    if (!workspace.extensions.defaultPrefix || workspace.extensions.defaultPrefix === '') {
      workspace.extensions.defaultPrefix = opts.defaultPrefix;
    }

    if (!workspace.extensions.natures) {
      workspace.extensions.natures = {};
    }
    if (!workspace.extensions.natures['@wdtk/stencil']) {
      workspace.extensions.natures['@wdtk/stencil'] = { name: 'Stencil' };
    }
  });
}
