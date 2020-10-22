import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { concatMap, switchMap, map } from 'rxjs/operators';

import { runPhp } from './../../util';

import { Schema } from './schema';

export interface ServeBuilderOptions extends Schema {}

export default createBuilder<ServeBuilderOptions & JsonObject>(execute);

export function execute(opts: ServeBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(normalizeOptions()).pipe(
    switchMap(() =>
      runPhp(ctx).pipe(
        map((result) => {
          return result;
        })
      )
    )
  );
}
export function executeC(opts: ServeBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  // return from(normalizeOptions()).pipe(concatMap((opts) => runPhp(ctx)));
  // return runPhp(ctx);
  // return from(normalizeOptions()).pipe(switchMap((opts) => runPhp(ctx)));
  return from(normalizeOptions()).pipe(
    switchMap(() =>
      runPhp(ctx).pipe(
        map((result) => {
          return result;
        })
      )
    )
  );
}

async function normalizeOptions(): Promise<any> {
  return {};
}

export function executeA(opts: ServeBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return new Observable<BuilderOutput>((obs) => {
    obs.next({ success: true });
    obs.complete();
  });
}
