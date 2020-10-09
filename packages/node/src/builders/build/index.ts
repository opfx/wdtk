import { BuilderContext } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { Schema } from './schema';

export interface BuildBuilderOptions extends Schema {}

export default createBuilder<JsonObject & BuildBuilderOptions>(execute);

function execute(opts: JsonObject & BuildBuilderOptions, ctx: BuilderContext): Observable<any> {
  return of(null);
}
