import { join, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain } from '@angular-devkit/schematics';
import { getWorkspaceDefinition, readJsonInTree, updateJsonInTree } from '@wdtk/core';
import { serializeJson } from '@wdtk/core/util';

import { extensionsRecommendations } from '../../constants';

/*
 * Adds the vscode extension recommended for running Jest tests to the workspace root extension recommendations.
 *
 */
export default function (): Rule {
  return chain([setupWorkspaceVsCodeExtensionsRecommendations(), removeObsoleteVsCodeLaunchConfigurations()]);
}

/** Adds the vscode extension recommended for running Jest the workspace root extension recommendations.
 */
function setupWorkspaceVsCodeExtensionsRecommendations() {
  return updateJsonInTree('/.vscode/extensions.json', (extensions, ctx: SchematicContext) => {
    ctx.logger.debug(` ∙ setting up vscode extension recommendations`);
    const existingRecommendations: string[] = extensions.recommendations || [];
    const extensionsToAdd = extensionsRecommendations.filter((extension) => {
      let includes = false;
      includes = existingRecommendations.includes(extension);
      return !includes;
    });
    extensionsToAdd.forEach((extension) => {
      existingRecommendations.push(extension);
    });
    extensions.recommendations = existingRecommendations;
  });
}

function removeObsoleteVsCodeLaunchConfigurations(): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    const workspace = await getWorkspaceDefinition(tree);
    workspace.projects.forEach((project) => {
      const projectRoot = project.root;
      const launchesPath = join(normalize(projectRoot), '/.vscode/launch.json');
      if (tree.exists(launchesPath)) {
        let content = readJsonInTree(tree, launchesPath);
        let configurations = content.configurations;
        configurations = configurations.filter((configuration) => {
          return configuration.name !== 'vscode-jest-tests';
        });
        content.configurations = configurations;
        tree.overwrite(launchesPath, serializeJson(content));
      }
    });
  };
}
