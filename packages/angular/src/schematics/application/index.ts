import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, move, schematic } from '@angular-devkit/schematics';

import { strings } from '@wdtk/core/util';
import { readJsonInTree, getWorkspaceConfigPath } from '@wdtk/core';
import { addLintConfig } from '@wdtk/core';

import { Schema as ApplicationOptions } from './schema';

interface NormalizedOptions extends ApplicationOptions {
  appProjectRoot: string;
}
export default function (applicationOptions: ApplicationOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`Running '@wdtk/angular:application' schematic`);
    const opts = normalizeOptions(host, applicationOptions);

    const workspaceJson = readJsonInTree(host, getWorkspaceConfigPath(host));
    const appProjectRoot = workspaceJson.newProjectRoot ? `${workspaceJson.newProjectRoot}/${opts.name}` : opts.name;
    const e2eProjectRoot = workspaceJson.newProjectRoot ? `${workspaceJson.newProjectRoot}/${opts.name}` : `${opts.name}/e2e`;
    return chain([
      schematic('init', { ...opts }),
      externalSchematic('@schematics/angular', 'application', {
        ...opts,

        skipInstall: true,
        skipPackageJson: false,
      }),
      // move(appProjectRoot, opts.appProjectRoot),
    ]);
  };
}

function normalizeOptions(host: Tree, opts: ApplicationOptions): NormalizedOptions {
  const appDirectory = opts.directory ? strings.dasherize(opts.directory) : strings.dasherize(opts.name);
  return {
    ...opts,
    appProjectRoot: appDirectory,
  };
}
