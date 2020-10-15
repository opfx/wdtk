import * as ts from 'typescript';
import { Rule, MergeStrategy, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, externalSchematic, filter, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { deleteFile, formatFiles, getWorkspaceDefinition, offsetFromRoot } from '@wdtk/core';
import { normalizePackageName, normalizeProjectName, updateJsonInTree } from '@wdtk/core';
import { addGlobal, insert } from '@wdtk/core';
import { RemoveChange } from '@wdtk/core';

import { strings } from '@wdtk/core/util';

import { Schema } from './schema';
import { UnitTestRunner } from './schema';

export interface LibraryOptions extends Schema {
  projectRoot: string;
  packageName: string;
  entryFile: string;
  fileName: string;
}

export default function (opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      // schematic('init', { ...opts, skipInstall: true, skipFormat: true }),
      // externalSchematic('@wdtk/node', 'library', { ...opts, skipFormat: true, skipInstall: true }),
      externalSchematic('@wdtk/node', 'library', { ...opts, skipFormat: true }),
      generateFiles(opts),
      setupBarrelFile(opts),
      setupProjectTsConfig(opts),
      deleteFile(`${opts.projectRoot}/src/lib/${opts.fileName}.ts`),
      deleteFile(`${opts.projectRoot}/src/lib/${opts.fileName}.spec.ts`),
      formatFiles(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: LibraryOptions): Promise<LibraryOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot || '';

  opts.name = normalizeProjectName(opts.name);
  const packageName = normalizePackageName(tree, opts.name);

  const entryFile = 'index';

  const fileName = opts.name;
  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  return {
    ...opts,
    packageName,
    projectRoot,
    entryFile,
    fileName,
  };
}

function generateFiles(opts: LibraryOptions): Rule {
  const propertyName = strings.camelize(opts.name);
  const className = strings.classify(opts.name);
  return mergeWith(
    apply(url('./files'), [
      applyTemplates({ ...opts, fileName: opts.fileName, className, propertyName, offsetFromRoot: offsetFromRoot(opts.projectRoot) }),
      opts.unitTestRunner === UnitTestRunner.None ? filter((file) => !file.endsWith('.spec.ts')) : noop(),
      move(opts.projectRoot),
    ]),
    MergeStrategy.Overwrite
  );
}

function setupBarrelFile(opts: LibraryOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    const entryFilePath = `${opts.projectRoot}/src/${opts.entryFile}.ts`;
    const entryFileContent = tree.read(entryFilePath);
    if (!!entryFileContent) {
      const entryFileSource = entryFileContent.toString('utf-8');
      const entryFileSourceFile = ts.createSourceFile(entryFilePath, entryFileSource, ts.ScriptTarget.Latest, true);
      insert(tree, entryFilePath, [
        new RemoveChange(entryFilePath, 0, `export * from './lib/${opts.fileName}';`),
        ...addGlobal(entryFileSourceFile, entryFilePath, `export * from './lib/${opts.fileName}.module';`),
        ...addGlobal(entryFileSourceFile, entryFilePath, `export * from './lib/${opts.fileName}.service';`),
        ...addGlobal(entryFileSourceFile, entryFilePath, `export * from './lib/${opts.fileName}.controller';`),
      ]);
    }
  };
}

function setupProjectTsConfig(opts: LibraryOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    if (!tree.exists(`${opts.projectRoot}/tsconfig.lib.json`)) {
      return tree;
    }
    return updateJsonInTree(`${opts.projectRoot}/tsconfig.lib.json`, (tsConfig) => {
      tsConfig.compilerOptions.target = opts.target;
    });
  };
}
