import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { SpawnOptions } from 'child_process';
import * as Path from 'path';
import * as File from 'fs';

import { Observable } from 'rxjs';
import { from, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

import { runPhp } from './../../util';

import { Schema, ModeElement } from './schema';

export interface ServeBuilderOptions extends Schema {}

export default createBuilder<ServeBuilderOptions & JsonObject>(execute);

export function execute(opts: ServeBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(initialize(opts, ctx)).pipe(
    map((opts) => {
      return {
        spawnArgs: getPhpSpawnArgs(opts),
        spawnOpts: getPhpSpawnOpts(opts),
      };
    }),
    switchMap(({ spawnArgs, spawnOpts }) => {
      return runPhp(spawnArgs, spawnOpts, ctx);
    }),
    catchError((err) => {
      ctx.logger.error(err);
      return of({ error: `Executing 'build' target failed. Please check above for the error.`, success: false });
    })
  );
}

function getPhpSpawnArgs(opts: ServeBuilderOptions): string[] {
  const args = [];

  if (opts.debug.enabled) {
    args.push(`-dxdebug.start_with_request=${opts.debug.startWithRequest}`);
    let mode: any = opts.debug.mode;
    if (typeof opts.debug.mode === 'object') {
      mode = undefined;
      Object.keys(opts.debug.mode).forEach((key) => {
        mode = !mode ? `${opts.debug.mode[key]}` : `${mode}, ${opts.debug.mode[key]}`;
      });
    }

    args.push(`-dxdebug.mode=${mode}`);
    args.push(`-dxdebug.client_port=${opts.debug.clientPort}`);
    args.push(`-dxdebug.output_dir=${opts.debug.outputDir}`);
  }

  args.push('--server');
  args.push(`${opts.host}:${opts.port}`);
  args.push('--docroot');
  args.push(opts.docRoot);

  return args;
}

function getPhpSpawnOpts(opts: ServeBuilderOptions): SpawnOptions {
  return { cwd: opts.docRoot };
}

async function initialize(opts: ServeBuilderOptions, ctx: BuilderContext): Promise<any> {
  opts = await normalizeOptions(opts, ctx);

  // create the xdebug output dir
  if (opts.debug.outputDir && opts.debug.mode !== 'off') {
    if (!File.existsSync(opts.debug.outputDir)) {
      ctx.logger.debug(` ∙ creating xdebug output directory '${opts.debug.outputDir}'`);
      File.mkdirSync(opts.debug.outputDir, { recursive: true });
    }
  }

  return opts;
}

async function normalizeOptions(opts: ServeBuilderOptions, ctx: BuilderContext): Promise<any> {
  const projectMetadata = await ctx.getProjectMetadata(ctx.target);
  const projectRoot = Path.resolve(ctx.workspaceRoot, (projectMetadata as any).root);

  const mainPath = Path.resolve(ctx.workspaceRoot, opts.main);
  const docRoot = Path.dirname(mainPath);
  const index = Path.basename(opts.main);
  if (opts.debug.enabled) {
    if (opts.debug.outputDir) {
      opts.debug.outputDir = Path.resolve(ctx.workspaceRoot, opts.debug.outputDir);
    } else {
      opts.debug.outputDir = Path.join(projectRoot, '.xdebug');
      ctx.logger.debug(` ∙ xdebug output directory is not specified; using default '${opts.debug.outputDir}'`);
    }
  } else {
    opts.debug.outputDir = undefined;
  }

  return {
    ...opts,
    docRoot,
    index,
  };
}
