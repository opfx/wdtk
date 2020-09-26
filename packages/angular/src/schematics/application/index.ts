import { normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, externalSchematic, move, mergeWith, noop, schematic, url } from '@angular-devkit/schematics';

import {
  updateWorkspaceDefinition,
  getWorkspaceDefinition,
  getWorkspaceDefinitionPath,
  offsetFromRoot,
  updateJsonInTree,
  normalizeProjectName,
  normalizePackageName,
} from '@wdtk/core';
import { readJsonInTree } from '@wdtk/core';
import { formatFiles } from '@wdtk/core';
import { strings } from '@wdtk/core/util';
import { Schema } from './schema';

// prefix : if the user does not specify a prefix, the default prefix for the workspace should be used; however
// the default prefix is established by the 'init' schematic. The 'init' schematic is supposed to ask the user
// to provide a default prefix only once. Once the defaultPrefix is written to the workspace definition, this
// schematic can read it from there. This works without problem for all projects except the first one. The first
// project is problematic because the 'init' schematic, which asks for the defaultPrefix, is called after the options for
// this schematic have been evaluated.
// By wrapping the call to the underlying angular schematic, we get a chance to read the value of the defaultPrefix,
// AFTER the init schematic wrote it the workspace definition
export interface ApplicationOptions extends Schema {
  projectRoot: string;
  newProjectRoot: string;
  packageName: string;
}
export default function (opts: ApplicationOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`Running '@wdtk/angular:application' schematic`);
    opts = await normalizeOptions(tree, opts);

    return chain([
      schematic('init', { ...opts }),
      angularAppSchematic(opts),
      // adjust the tslint.json; from angular 10 it seems the generated tslint.json
      // for the application is a full copy of the root tslint.json
      (tree: Tree, ctx: SchematicContext) => {
        if (tree.exists(`${opts.projectRoot}/tslint.json`)) {
          let json = readJsonInTree(tree, `/${opts.projectRoot}/tslint.json`);
          const tslintOffset = `${offsetFromRoot(opts.projectRoot)}tslint.json`;
          if (json.extends !== tslintOffset) {
            const tsLintContent: any = {
              extends: `${offsetFromRoot(opts.projectRoot)}tslint.json`,
              rules: {
                'directive-selector': [true, 'attribute', opts.prefix, 'camelCase'],
                'component-selector': [true, 'element', opts.prefix, 'kebab-case'],
              },
            };
            tree.overwrite(`${opts.projectRoot}/tslint.json`, JSON.stringify(tsLintContent));
          }
        }
      },
      generateFiles(opts),
      setupUnitTestRunner(opts),
      setupE2eTestRunner(opts),
      adjustProjectDefinition(opts),
      formatFiles(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: ApplicationOptions): Promise<ApplicationOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot;

  opts.name = normalizeProjectName(opts.name);
  const packageName = normalizePackageName(tree, opts.name);

  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;

  const defaultPrefix: string | undefined = workspace.extensions.defaultPrefix as string;
  // see prefix comment at the top of the file
  if (defaultPrefix && defaultPrefix !== '' && opts.prefix === '#useDefault') {
    opts.prefix = defaultPrefix;
    (<any>opts).defaultPrefix = defaultPrefix;
  }

  return {
    ...opts,
    projectRoot,
    newProjectRoot,
    packageName,
  } as any;
}

function angularAppSchematic(opts: ApplicationOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    // see the prefix comment at the top of the file
    if (opts.prefix === '#useDefault') {
      const workspace = await getWorkspaceDefinition(tree);
      opts.prefix = workspace.extensions.defaultPrefix as string;
    }
    return externalSchematic('@schematics/angular', 'application', {
      ...opts,
      skipTests: opts.unitTestRunner === 'none' ? true : opts.skipTests,
      skipInstall: true,
      skipPackageJson: false,
    });
  };
}

function generateFiles(opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return chain([
      mergeWith(
        apply(url('./files'), [
          applyTemplates({
            ...opts,
            offsetFromRoot: offsetFromRoot(opts.projectRoot),
          }),
          move(opts.projectRoot),
        ])
      ),
    ]);
  };
}

function adjustProjectDefinition(opts: ApplicationOptions): Rule {
  if (opts.name === opts.name.toLowerCase()) {
    return noop();
  }
  return (tree: Tree, ctx: SchematicContext) => {
    return updateJsonInTree(getWorkspaceDefinitionPath(tree), (json) => {
      const projectDefinitionJson = json.projects[opts.name];
      delete json.projects[opts.name];
      json.projects[opts.name.toLowerCase()] = projectDefinitionJson;
      return json;
    });
  };
}
function setupE2eTestRunner(opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return chain([
      opts.e2eTestRunner !== 'protractor' ? removeProtractorSupport(opts) : noop(),
      opts.e2eTestRunner === 'cypress' ? externalSchematic('@wdtk/cypress', 'project', { project: opts.name }) : noop(),
    ]);
  };
}

function setupUnitTestRunner(opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    if (opts.unitTestRunner === 'jest') {
      return chain([
        removeKarmaSupport(opts), //
        externalSchematic('@wdtk/jest', 'project', { project: opts.name, setupFile: 'angular' }),
      ]);
    }
    if (opts.unitTestRunner === 'none') {
      return removeKarmaSupport(opts);
    }
  };
}

function removeKarmaSupport(opts: ApplicationOptions) {
  return chain([
    removeKarmaFiles(opts),
    updateWorkspaceDefinition((workspace) => {
      const project = workspace.projects.get(opts.name);
      project.targets.delete('test');

      const lintTarget = project.targets.get('lint');
      if (lintTarget && lintTarget.options && Array.isArray(lintTarget.options.tsConfig)) {
        lintTarget.options.tsConfig = lintTarget.options.tsConfig.filter((currTsConfig: string) => !currTsConfig.includes('tsconfig.spec.json'));
      }
    }),
  ]);
}

function removeKarmaFiles(opts: ApplicationOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    const workspace = await getWorkspaceDefinition(tree);
    const project = workspace.projects.get(opts.name);
    const root = normalize(project.root);
    ctx.logger.debug(`Removing 'karma' files from ${root}...`);

    if (tree.exists(`${root}/karma.conf.js`)) {
      ctx.logger.debug(` * ${root}/karma.conf.js`);
      tree.delete(`${root}/karma.conf.js`);
    }

    if (tree.exists(`${root}/tsconfig.spec.json`)) {
      ctx.logger.debug(` * ${root}/tsconfig.spec.json`);
      tree.delete(`${root}/tsconfig.spec.json`);
    }

    if (tree.exists(`${root}/src/test.ts`)) {
      ctx.logger.debug(` * ${root}/src/test.ts`);
      tree.delete(`${root}/src/test.ts`);
    }
  };
}
function removeProtractorSupport(opts: ApplicationOptions): Rule {
  const e2eDirectory = `${opts.projectRoot}/e2e/`;
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`Removing protractor e2e project`);
    return chain([
      (tree) => {
        if (tree.read(`${e2eDirectory}/src/app.e2e-spec.ts`)) {
          tree.delete(`${e2eDirectory}/src/app.e2e-spec.ts`);
        }
        if (tree.read(`${e2eDirectory}/src/app.po.ts`)) {
          tree.delete(`${e2eDirectory}/src/app.po.ts`);
        }
        if (tree.read(`${e2eDirectory}/protractor.conf.js`)) {
          tree.delete(`${e2eDirectory}/protractor.conf.js`);
        }
        if (tree.read(`${e2eDirectory}/tsconfig.json`)) {
          tree.delete(`${e2eDirectory}/tsconfig.json`);
        }
      },
      (tree) => {
        return updateWorkspaceDefinition((workspace) => {
          const project = workspace.projects.get(opts.name);
          project.targets.delete('e2e');

          const lintTarget = project.targets.get('lint');
          if (lintTarget && lintTarget.options && Array.isArray(lintTarget.options.tsConfig)) {
            lintTarget.options.tsConfig = lintTarget.options.tsConfig.filter(
              (currTsConfig: string) => !(currTsConfig.includes('tsconfig.json') && currTsConfig.includes('/e2e/'))
            );
          }
        });
      },
    ]);
  };
}
