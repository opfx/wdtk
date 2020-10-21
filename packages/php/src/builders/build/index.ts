import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { Observable } from 'rxjs';

import { Schema } from './schema';

export interface BuildBuilderOptions extends Schema {}

export default createBuilder<BuildBuilderOptions & JsonObject>(execute);

export function execute(opts: BuildBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return new Observable<BuilderOutput>((obs) => {
    obs.next({ success: true });
    obs.complete();
  });
}
