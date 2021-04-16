import { join, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, move, mergeWith, schematic, url } from '@angular-devkit/schematics';

import * as Path from 'path';

import { addInstallTask, formatFiles, getWorkspaceDefinition } from '@wdtk/core';
import { normalizeProjectName, normalizePackageName, offsetFromRoot, updateWorkspaceDefinition } from '@wdtk/core';
import { updateProjectDefinition } from '@wdtk/core';

import { strings } from '@wdtk/core/util';

import { versions } from '../../constants';

import { Schema } from './schema';

interface LibraryOptions extends Schema {
  outputPath: string;
  packageName: string;
  packageNameForComposer: string;
  projectRoot: string;
  projectType: string;
}

export default function (opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    ctx.logger.debug(`▶ Running '@wdtk/php:library' schematic`);
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
 * Generates the project files for the PHP library.
 * @param opts
 */
function generateFiles(opts: LibraryOptions): Rule {
  const normalizedProjectRoot = normalize(opts.projectRoot);
  const sourceRoot = join(normalizedProjectRoot, 'src');
  const distRoot = Path.dirname(opts.outputPath);
  return mergeWith(
    apply(url('./files'), [
      applyTemplates({
        strings,
        ...opts,
        dot: '.',
        offsetFromRoot: offsetFromRoot(opts.projectRoot),
        outputDirOffsetFromRoot: offsetFromRoot(distRoot),
        sourceRoot,
        distRoot,
        // rely on php paratest to pull in phpunit
        // phpUnitVersion: versions.PhpUnit,
        paratestVersion: versions.Paratest,
      }),
      move(opts.projectRoot),
    ])
  );
}

/**
 * Generates the project definition for the PHP library.
 * @param opts
 */
function generateProjectDefinition(opts: LibraryOptions): Rule {
  const normalizedProjectRoot = normalize(opts.projectRoot);
  return updateProjectDefinition(opts.name, (project) => {
    project.targets.add({
      name: 'build',
      builder: '@wdtk/php:build',
      options: {
        outputPath: opts.outputPath,
        main: join(normalizedProjectRoot, 'src/main.php'),
        package: true,
      },
    });
    project.targets.add({
      name: 'test',
      builder: '@wdtk/php:test',
      options: {
        parallel: true,
        processes: 'auto',
      },
    });
  });
}

async function normalizeOptions(tree: Tree, opts: LibraryOptions): Promise<LibraryOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot;

  opts.name = normalizeProjectName(opts.name);

  const packageName = normalizePackageName(tree, opts.name);
  const packageNameForComposer = packageName.replace('@', '');
  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  const outputPath = normalize(`dist/lib/`);

  return {
    ...opts,
    outputPath,
    packageName,
    packageNameForComposer,
    projectRoot,
    projectType: 'library',
  };
}
