import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, externalSchematic, filter, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { addInstallTask, formatFiles, getWorkspaceDefinition } from '@wdtk/core';
import { normalizeProjectName, normalizePackageName, offsetFromRoot, updateJsonInTree, updateWorkspaceDefinition } from '@wdtk/core';
import { addProjectDependencies, addWorkspaceDependencies, NodeDependency, NodeDependencyType } from '@wdtk/core';
import { strings } from '@wdtk/core/util';

import { versions } from './../../versions';

import { Schema } from './schema';

export interface LibraryOptions extends Schema {
  projectRoot: string;
  packageName: string;
}

const workspaceDependencies: NodeDependency[] = [
  //
  { type: NodeDependencyType.Dev, name: 'ng-packagr', version: versions.NgPackager },
];
const projectDependencies: NodeDependency[] = [
  { type: NodeDependencyType.Default, name: 'tslib', version: versions.TsLib },
  { type: NodeDependencyType.Peer, name: '@angular/common', version: versions.Angular },
  { type: NodeDependencyType.Peer, name: '@angular/core', version: versions.Angular },
];
export default function (opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      schematic('init', { ...opts, skipFormat: true, skipInstall: true }),
      opts.wrapperApp ? schematic('application', { ...opts, skipFormat: true }) : noop(),
      addLibraryToWorkspaceDefinition(opts),
      generateFiles(opts),

      addProjectDependencies(opts.name, projectDependencies),
      addWorkspaceDependencies(workspaceDependencies),
      adjustProjectTsConfig(opts),
      setupUnitTestRunner(opts),
      opts.skipTsConfig ? noop() : adjustWorkspaceTsConfig(opts),
      formatFiles(opts),
      addTasks(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: Partial<LibraryOptions>): Promise<LibraryOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot;

  opts.name = normalizeProjectName(opts.name);
  const packageName = normalizePackageName(tree, opts.name);

  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  const defaultPrefix: string | undefined = workspace.extensions.defaultPrefix as string;
  // see prefix comment at the top of the file
  if (defaultPrefix && defaultPrefix !== '' && opts.prefix === 'use-default-prefix') {
    opts.prefix = defaultPrefix;
    (<any>opts).defaultPrefix = defaultPrefix;
  }

  return { ...opts, projectRoot, packageName };
}

function addTasks(opts: LibraryOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return addInstallTask(opts);
  };
}

// templates to be filtered out if a wrapper application was created
function wrapperAppPathFilter(path: string): boolean {
  const toRemoveList = /(karma.conf.js|package.json|test.ts|tsconfig.json|tsconfig.spec.json|tslint.json).template$/;

  return !toRemoveList.test(path);
}

function karmaPathFilter(path: string): boolean {
  const toRemoveList = /(karma.conf.js|test.ts|tsconfig.spec.json).template$/;

  return !toRemoveList.test(path);
}
function generateFiles(opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    if (opts.prefix === 'use-default-prefix') {
      const workspace = await getWorkspaceDefinition(tree);
      opts.prefix = workspace.extensions.defaultPrefix as string;
    }
    const srcDir = `${opts.projectRoot}/src/lib`;
    const distDir = `dist/${opts.name}`;
    return chain([
      mergeWith(
        apply(url('./files'), [
          opts.wrapperApp ? filter(wrapperAppPathFilter) : noop(),
          opts.unitTestRunner !== 'karma' ? filter(karmaPathFilter) : noop(),
          applyTemplates({
            ...opts,
            distRoot: distDir,
            offsetFromRoot: offsetFromRoot(opts.projectRoot),
            dasherize: strings.dasherize,
            camelize: strings.camelize,
          }),
          move(opts.projectRoot),
        ])
      ),
      externalSchematic('@schematics/angular', 'module', {
        name: opts.name,
        commonModule: false,
        flat: true,
        path: srcDir,
        export: true,
        project: opts.name,
      }),
      externalSchematic('@schematics/angular', 'component', {
        name: opts.name,
        selector: `${opts.prefix}-${opts.name}`,
        inlineStyle: true,
        inlineTemplate: true,
        flat: true,
        path: srcDir,
        export: true,
        project: opts.name,
      }),
      externalSchematic('@schematics/angular', 'service', {
        name: opts.name,
        flat: true,
        path: srcDir,
        project: opts.name,
      }),
    ]);
  };
}

function addLibraryToWorkspaceDefinition(opts: LibraryOptions): Rule {
  // if the library has a wrapper application, the application schematic
  // will create the project definition
  if (opts.wrapperApp) {
    return noop();
  }

  const projectDefinition = {
    name: opts.name,
    root: opts.projectRoot,
    sourceRoot: `${opts.projectRoot}/src`,
    projectType: 'library',
    prefix: opts.prefix,
    targets: {
      build: {
        builder: '@angular-devkit/build-angular:ng-packagr',
        options: {
          tsConfig: `${opts.projectRoot}/tsconfig.lib.json`,
          project: `${opts.projectRoot}/ng-package.json`,
        },
        configurations: {
          production: {
            tsConfig: `${opts.projectRoot}/tsconfig.lib.prod.json`,
          },
        },
      },
      test: {
        builder: '@angular-devkit/build-angular:karma',
        options: {
          main: `${opts.projectRoot}/src/test.ts`,
          tsConfig: `${opts.projectRoot}/tsconfig.spec.json`,
          karmaConfig: `${opts.projectRoot}/karma.conf.js`,
        },
      },
      lint: {
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: [`${opts.projectRoot}/tsconfig.lib.json`, `${opts.projectRoot}/tsconfig.spec.json`],
          exclude: ['**/node_modules/**'],
        },
      },
    },
  };
  if (opts.unitTestRunner !== 'karma') {
    delete projectDefinition.targets.test;
  }
  return updateWorkspaceDefinition((workspace) => {
    workspace.projects.add(projectDefinition);
  });
}

function adjustProjectTsConfig(opts: LibraryOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    if (!tree.exists(`${opts.projectRoot}/tsconfig.json`)) {
      return tree;
    }
    return updateJsonInTree(`${opts.projectRoot}/tsconfig.json`, (tsConfig) => {
      if (!tsConfig.references) {
        tsConfig.references = [];
      }

      tsConfig.references.push({ path: './tsconfig.lib.json' });
    });
  };
}

function adjustWorkspaceTsConfig(opts: LibraryOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    if (!tree.exists('tsconfig.json')) {
      return tree;
    }
    return updateJsonInTree('tsconfig.json', (tsConfig) => {
      if (!tsConfig.compilerOptions.paths) {
        tsConfig.compilerOptions.paths = {};
      }
      if (!tsConfig.compilerOptions.paths[opts.packageName]) {
        tsConfig.compilerOptions.paths[opts.packageName] = [];
      }
      tsConfig.compilerOptions.paths[opts.packageName].push(`${opts.projectRoot}/src/${opts.entryFile}.ts`);
    });
  };
}

function setupUnitTestRunner(opts: LibraryOptions): Rule {
  if (opts.unitTestRunner !== 'jest' || opts.wrapperApp) {
    return noop();
  }

  return (tree: Tree, ctx: SchematicContext) => {
    return chain([externalSchematic('@wdtk/jest', 'project', { project: opts.name, setupFile: 'angular' })]);
  };
}
