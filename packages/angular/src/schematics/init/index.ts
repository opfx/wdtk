import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, noop } from '@angular-devkit/schematics';
import { addWorkspaceDependencies, updateWorkspaceDefinition, NodeDependency, NodeDependencyType } from '@wdtk/core';
import { addInstallTask, formatFiles, readJsonInTree } from '@wdtk/core';

import { versions } from './../../versions';

import { Schema as InitOptions } from './schema';

const workspaceDependencies: NodeDependency[] = [
  { name: '@angular/animations', type: NodeDependencyType.Default, version: versions.Angular },
  { name: '@angular/common', type: NodeDependencyType.Default, version: versions.Angular },
  { name: '@angular/compiler', type: NodeDependencyType.Default, version: versions.Angular },
  { name: '@angular/core', type: NodeDependencyType.Default, version: versions.Angular },
  { name: '@angular/forms', type: NodeDependencyType.Default, version: versions.Angular },
  { name: '@angular/platform-browser', type: NodeDependencyType.Default, version: versions.Angular },
  { name: '@angular/platform-browser-dynamic', type: NodeDependencyType.Default, version: versions.Angular },
  { name: '@angular/router', type: NodeDependencyType.Default, version: versions.Angular },
  { name: 'rxjs', type: NodeDependencyType.Default, version: versions.Rxjs },
  { name: 'zone.js', type: NodeDependencyType.Default, version: versions.ZoneJs },
  // dev dependencies
  { name: '@angular/cli', type: NodeDependencyType.Dev, version: versions.Angular },
  { name: '@angular/compiler-cli', type: NodeDependencyType.Dev, version: versions.Angular },
  { name: '@angular/language-service', type: NodeDependencyType.Dev, version: versions.Angular },
  { name: '@angular-devkit/build-angular', type: NodeDependencyType.Dev, version: versions.AngularBuild },
];

const protractorWorkspaceDependencies: NodeDependency[] = [
  //dev dependencies
  { name: 'protractor', type: NodeDependencyType.Dev, version: versions.Protractor },
  { name: 'jasmine-core', type: NodeDependencyType.Dev, version: versions.JasmineCore },
  { name: 'jasmine-spec-reporter', type: NodeDependencyType.Dev, version: versions.JasmineSpecReporter },
  { name: '@types/jasmine', type: NodeDependencyType.Dev, version: versions.JasmineTypes },
  { name: '@types/jasminewd2', type: NodeDependencyType.Dev, version: versions.JasmineWd2Types },
];

const karmaWorkspaceDependencies: NodeDependency[] = [
  //dev dependencies
  { name: 'karma', type: NodeDependencyType.Dev, version: versions.Karma },
  { name: 'karma-chrome-launcher', type: NodeDependencyType.Dev, version: versions.KarmaChromeLauncher },
  { name: 'karma-coverage-istanbul-reporter', type: NodeDependencyType.Dev, version: versions.KarmaCoverageIstanbulReporter },
  { name: 'karma-jasmine', type: NodeDependencyType.Dev, version: versions.KarmaJasmine },
  { name: 'karma-jasmine-html-reporter', type: NodeDependencyType.Dev, version: versions.KarmaJasmineHtmlReporter },
  { name: 'jasmine-core', type: NodeDependencyType.Dev, version: versions.JasmineCore },
  { name: 'jasmine-spec-reporter', type: NodeDependencyType.Dev, version: versions.JasmineSpecReporter },
  { name: '@types/jasmine', type: NodeDependencyType.Dev, version: versions.JasmineTypes },
];

export default function (opts: InitOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return chain([
      externalSchematic('@wdtk/workspace', 'typescript', { skipInstall: true }), //
      addWorkspaceDependencies(workspaceDependencies),
      addE2eTestRunnerWorkspaceDependencies(opts),
      addUnitTestRunnerWorkspaceDependencies(opts),
      setupWorkspaceDefinition(opts),
      formatFiles(opts),
      addInstallTask(opts),
    ]);
  };
}

function setupWorkspaceDefinition(opts: InitOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    return updateWorkspaceDefinition((workspace) => {
      if (!workspace.extensions.defaultPrefix || workspace.extensions.defaultPrefix === '') {
        workspace.extensions.defaultPrefix = opts.defaultPrefix;
      }
      if (!workspace.extensions.natures) {
        workspace.extensions.natures = {};
      }
      if (!workspace.extensions.natures['@wdtk/angular']) {
        workspace.extensions.natures['@wdtk/angular'] = { name: 'Angular' };
      }
    });
  };
}

function addE2eTestRunnerWorkspaceDependencies(opts: Pick<InitOptions, 'e2eTestRunner'>): Rule {
  switch (opts.e2eTestRunner) {
    case 'protractor':
      return (tree: Tree, ctx: SchematicContext) => {
        const packageJson = readJsonInTree(tree, '/package.json');
        if (packageJson.devDependencies['protractor']) {
          return noop();
        }
        return addWorkspaceDependencies(protractorWorkspaceDependencies);
      };

    case 'cypress':
    // fall through

    default:
      return noop();
  }
}

function addUnitTestRunnerWorkspaceDependencies(opts: Pick<InitOptions, 'unitTestRunner'>): Rule {
  switch (opts.unitTestRunner) {
    case 'karma':
      return (tree: Tree, ctx: SchematicContext) => {
        const packageJson = readJsonInTree(tree, 'package.json');
        if (packageJson.devDependencies['karma']) {
          ctx.logger.debug(`Skipping '${opts.unitTestRunner}' dependencies (they already exist).`);
          return noop();
        }
        ctx.logger.debug(`Adding '${opts.unitTestRunner}' dependencies.`);
        return addWorkspaceDependencies(karmaWorkspaceDependencies);
      };
    case 'jest':
    // fall through
    default:
      return noop();
  }
}
