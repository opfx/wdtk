import { Rule, SchematicContext } from '@angular-devkit/schematics';

import { updateJsonInTree } from '@wdtk/core';

import { extensionsRecommendations } from '../../constants';

/*
 * Adds the vscode extension recommended for running Jest tests to the workspace root extension recommendations.
 *
 */
export default function (): Rule {
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
