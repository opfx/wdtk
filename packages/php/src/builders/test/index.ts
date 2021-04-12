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

export interface TestBuilderOptions extends Schema {
  projectRoot: string;
}

export default createBuilder<TestBuilderOptions & JsonObject>(execute);

export function execute(opts: TestBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
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
      return of({ error: `Executing 'test' target failed. Please check above for the error.`, success: false });
    })
  );
}

function getPhpSpawnOpts(opts: TestBuilderOptions): SpawnOptions {
  return { cwd: opts.projectRoot };
}

function getPhpSpawnArgs(opts: TestBuilderOptions): string[] {
  const args = [];

  let toolToRun = 'phpunit';
  if (opts.parallel) {
    toolToRun = 'paratest';
  }
  const toolPath = Path.join('vendor', 'bin', toolToRun);

  args.push(toolPath);
  //args.push('-vv');

  // if running parallel the tool is paratest, so add paratest specific args
  if (opts.parallel) {
    if (opts.useWrapperRunner && !opts.useFunctionalMode) {
      args.push('--runner');
      args.push('WrapperRunner');
    }
    args.push(`--processes`);
    args.push(opts.processes);
    if (opts.useFunctionalMode) {
      args.push('-f');
      args.push('--max-batch-size');
      args.push(opts.maxBatchSize);
    }
  }

  return args;
}

async function normalizeOptions(opts: TestBuilderOptions, ctx: BuilderContext): Promise<TestBuilderOptions> {
  if (opts.parallel) {
    try {
      switch (typeof opts.processes) {
        case 'string':
          if (opts.processes !== 'auto') {
            throw new Error('Invalid value');
          }
          break;
        case 'number':
          if (opts.processes < 1) {
            throw new Error('Invalid value');
          }
          break;
        default:
      }
    } catch (err) {
      ctx.logger.warn(`The 'processes' option has an invalid value [${opts.processes}]. You can only use positive integers or 'auto'.`);
      ctx.logger.warn(`Falling back to the default value [auto].`);
      opts.processes = 'auto';
    }
  }
  const projectMetadata = await ctx.getProjectMetadata(ctx.target);
  const projectRoot = Path.resolve(ctx.workspaceRoot, (projectMetadata as any).root);
  return {
    ...opts,
    projectRoot,
  };
}
