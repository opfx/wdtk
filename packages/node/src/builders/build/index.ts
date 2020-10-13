import * as Path from 'path';
import { BuilderContext } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { runWebpack } from '@angular-devkit/build-webpack';
import { BuildResult as WebpackBuildResult } from '@angular-devkit/build-webpack';
import { JsonObject } from '@angular-devkit/core';

import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

import { getWorkspaceDefinition } from '@wdtk/core';

import { BuilderOptions, OUT_FILENAME } from './../../util';
import { Schema } from './schema';
import { normalizeOptions } from './normalize-options';
import { getBuildWebpackConfig } from './config';

try {
  require('dotenv').config();
} catch (e) {}

export type BuildBuilderOptions = Schema & BuilderOptions;

export type BuildResult = WebpackBuildResult & {
  outfile: string;
};

export default createBuilder<BuildBuilderOptions & JsonObject>(execute);

function execute(opts: BuildBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuildResult> {
  // if (!opts.buildLibsFromSource) {
  //   throw new Error('Unimplemented');
  // }

  return from(getSourceRoot(ctx)).pipe(
    map((sourceRoot: string) => normalizeOptions(opts, ctx.workspaceRoot, sourceRoot)),
    map((opts) => {
      let config = getBuildWebpackConfig(opts);
      return config;
    }),
    concatMap((config) => {
      return runWebpack(config, ctx, {
        logging: (stats) => {
          ctx.logger.info(stats.toString(config.stats));
        },
        webpackFactory: require('webpack'),
      });
    }),
    map((buildResult: BuildResult) => {
      buildResult.outfile = Path.resolve(ctx.workspaceRoot, opts.outputPath, OUT_FILENAME);
      return buildResult;
    })
  );
}

async function getSourceRoot(ctx: BuilderContext) {
  const workspace = await getWorkspaceDefinition(ctx.workspaceRoot);
  const project = workspace.projects.get(ctx.target.project);

  if (project.sourceRoot) {
    return project.sourceRoot;
  }
  ctx.reportStatus(`Error`);
  const message = `${ctx.target.project} does not have a sourceRoot. Please define one.`;
  ctx.logger.error(message);
  throw new Error(message);
}
