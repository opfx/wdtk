import { normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, filter, mergeWith, noop, url } from '@angular-devkit/schematics';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getProjectDefinition, getWorkspaceDefinition, updateWorkspaceDefinition } from '@wdtk/core';
import { tags } from '@wdtk/core/util';

import { Schema as RemoveOptions } from './schema';

export default function (opts: RemoveOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    const workspace = await getWorkspaceDefinition(tree);
    if (!workspace.projects.has(opts.projectName)) {
      ctx.logger.warn(`Project '${opts.projectName}' does not exist.`);
      return noop();
    }
    return chain([checkTargets(opts), removeProjectFiles(opts), removeProjectDefinition(opts), updateWorkspaceDefaultProject(opts)]);
  };
}

function checkTargets(opts: RemoveOptions): Rule {
  if (opts.forceRemove) {
    return (tree: Tree) => tree;
  }

  return updateWorkspaceDefinition((workspace) => {
    const findTarget = new RegExp(`${opts.projectName}:`);

    const usedIn = [];

    for (const name of Object.keys(workspace.projects)) {
      if (name === opts.projectName) {
        continue;
      }

      const projectStr = JSON.stringify(workspace.projects[name]);

      if (findTarget.test(projectStr)) {
        usedIn.push(name);
      }
    }

    if (usedIn.length > 0) {
      let message = `${opts.projectName} is still targeted by the following projects:\n\n`;
      for (let project of usedIn) {
        message += `${project}\n`;
      }
      throw new Error(message);
    }
  });
}

function removeProjectFiles(opts: RemoveOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    const project = await getProjectDefinition(tree, opts.projectName);
    const projectRoot = project.root;
    tree.delete(normalize(project.root));
  };
}

/**
 * Removes (deletes) a project from the folder tree
 *
 * @param opts The options provided to the schematic
 */
function removeProjectDefinition(opts: RemoveOptions): Rule {
  return (tree: Tree, ctx: SchematicContext): Observable<Tree> => {
    return from(getWorkspaceDefinition(tree)).pipe(
      map((workspace) => {
        const project = workspace.projects.get(opts.projectName);
        tree.delete(project.root);
        return tree;
      })
    );
  };
}

/**
 * Deletes the project from the workspace file
 *
 * @param schema The options provided to the schematic
 */
export function updateWorkspaceDefaultProject(opts: RemoveOptions) {
  return (tree: Tree, ctx: SchematicContext) => {
    return updateWorkspaceDefinition((workspace) => {
      if (workspace.extensions.defaultProject && workspace.extensions.defaultProject === opts.projectName) {
        delete workspace.extensions.defaultProject;
        ctx.logger.warn(tags.stripIndents`
        Default project was removed because it was '${opts.projectName}'. If you want a default project you should define a new one.
        `);
      }
    });
  };
}

/**
 * Updates the tsconfig paths to remove the project.
 *
 * @param schema The options provided to the schematic
 */
function updateTsConfig(schema: RemoveOptions) {
  // return (tree: Tree, _context: SchematicContext): Observable<Tree> => {
  //   return from(getWorkspaceDefinition(tree)).pipe(
  //     map((workspace) => {
  //       const nxJson = readJsonInTree<NxJson>(tree, 'nx.json');
  //       const project = workspace.projects.get(schema.projectName);
  //       const tsConfigPath = 'tsconfig.base.json';
  //       if (tree.exists(tsConfigPath)) {
  //         const tsConfigJson = readJsonInTree(tree, tsConfigPath);
  //         delete tsConfigJson.compilerOptions.paths[`@${nxJson.npmScope}/${project.root.substr(5)}`];
  //         tree.overwrite(tsConfigPath, serializeJson(tsConfigJson));
  //       }
  //       return tree;
  //     })
  //   );
  // };
}
