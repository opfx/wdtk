import { join, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, move, mergeWith, schematic, url } from '@angular-devkit/schematics';

import { addInstallTask, formatFiles, getWorkspaceDefinition, offsetFromRoot } from '@wdtk/core';
import { normalizePackageName, normalizeProjectName } from '@wdtk/core';
import { ProjectDefinition } from '@wdtk/core';
import { updateProjectDefinition, updateWorkspaceDefinition } from '@wdtk/core';

import { strings } from '@wdtk/core/util';

import { Schema } from './schema';

export interface ApplicationOptions extends Schema {
  outputPath: string;
  packageName: string;
  packageNameForComposer: string;
  projectRoot: string;
  projectType: string;
}

export default function (opts: ApplicationOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`▶ Running '@wdtk/php:application' schematic`);
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('project', { ...opts, skipFormat: true, skipInstall: true }), //
      generateFiles(opts),
      generateProjectDefinition(opts),
      formatFiles(opts),
      addInstallTask(opts),
    ]);
  };
}

/**
 * Generates the project files for the PHP application.
 * @param opts
 */
function generateFiles(opts: ApplicationOptions): Rule {
  return mergeWith(
    apply(url('./files'), [
      applyTemplates({
        ...opts,
        dot: '.',
        offsetFromRoot: offsetFromRoot(opts.projectRoot),
      }),
      move(opts.projectRoot),
    ])
  );
}

/**
 * Generates the project definition for the PHP application.
 * @param opts
 */
function generateProjectDefinition(opts: ApplicationOptions): Rule {
  const normalizedProjectRoot = normalize(opts.projectRoot);
  return updateProjectDefinition(opts.name, (project) => {
    project.targets.add({
      name: 'build',
      builder: '@wdtk/php:build',
      options: {
        outputPath: opts.outputPath,
        main: join(normalizedProjectRoot, 'src/app/index.php'),
        package: false,
        assets: [
          {
            glob: 'favicon.ico',
            input: join(normalizedProjectRoot, 'src'),
            output: 'pub',
          },
        ],
      },
    });
    project.targets.add({
      name: 'serve',
      builder: '@wdtk/php:serve',
      options: {
        main: join(normalizedProjectRoot, 'src/app/index.php'),
        debug: {
          enabled: true,
          clientPort: 9000,
          startWithRequest: 'yes',
          mode: 'debug',
          outputDir: `${normalizedProjectRoot}/.xdebug`,
        },
      },
    });
  });
}

async function normalizeOptions(tree: Tree, opts: ApplicationOptions): Promise<ApplicationOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot || '';

  opts.name = normalizeProjectName(opts.name);
  const packageName = normalizePackageName(tree, opts.name);
  const packageNameForComposer = packageName.replace('@', '');

  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  const outputPath = normalize(`dist/app/${opts.name}`);
  return {
    ...opts,
    outputPath,
    projectRoot,
    packageName,
    packageNameForComposer,
    projectType: 'application',
  };
}
