import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import * as Path from 'path';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { concatMap, switchMap, map, tap } from 'rxjs/operators';

import { runPhp } from './../../util';

import { Schema } from './schema';

export interface ServeBuilderOptions extends Schema {}

export default createBuilder<ServeBuilderOptions & JsonObject>(execute);

export function execute(opts: ServeBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(normalizeOptions(opts, ctx)).pipe(
    switchMap((opts) =>
      runPhp(opts, ctx).pipe(
        map((result) => {
          return result;
        })
      )
    )
  );
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
