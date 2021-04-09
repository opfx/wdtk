import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { SpawnOptions } from 'child_process';
import * as Path from 'path';

import { Observable } from 'rxjs';
import { from, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

import { runPhp } from './../../util';

import { Schema } from './schema';

export interface ServeBuilderOptions extends Schema {}

export default createBuilder<ServeBuilderOptions & JsonObject>(execute);

export function execute(opts: ServeBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(normalizeOptions(opts, ctx)).pipe(
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
  args.push('--server');
  args.push(`${opts.host}:${opts.port}`);
  args.push('--docroot');
  args.push(opts.docRoot);

  return args;
}

function getPhpSpawnOpts(opts: ServeBuilderOptions): SpawnOptions {
  return { cwd: opts.docRoot };
}

async function normalizeOptions(opts: ServeBuilderOptions, ctx: BuilderContext): Promise<any> {
  const mainPath = Path.resolve(ctx.workspaceRoot, opts.main);
  const docRoot = Path.dirname(mainPath);
  const index = Path.basename(opts.main);
  return {
    ...opts,
    docRoot,
    index,
  };
}
