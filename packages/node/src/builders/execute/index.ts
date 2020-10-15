import { ChildProcess, spawn } from 'child_process';
import { fork } from 'child_process';
import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder, scheduleTargetAndForget, targetFromTargetString } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { Observable, bindCallback, of, zip, from, iif } from 'rxjs';
import { concatMap, tap, mapTo, first, map, filter } from 'rxjs/operators';

import * as treeKill from 'tree-kill';

import { tags } from '@wdtk/core/util';

import { BuildResult } from './../build';

import { Schema } from './schema';
import { InspectEnum } from './schema';

try {
  require('dotenv').config();
} catch {}

let subProcess: ChildProcess = null;

export type ExecuteBuilderOptions = Schema;

export default createBuilder<ExecuteBuilderOptions & JsonObject>(execute);

export function execute(opts: ExecuteBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return runWaitUntilTargets(opts, ctx).pipe(
    concatMap((o) => {
      if (!o.success) {
        return of({ success: false });
      }
      return startBuild(opts, ctx).pipe(
        concatMap((result: BuildResult) => {
          if (!result.success) {
            ctx.logger.error(`There was an error with the build. See above.`);
            ctx.logger.info(`${result.outfile} was not restarted.`);
          }
          return processBuildResult(result, opts, ctx).pipe(mapTo(result));
        })
      );
    })
  );
}

function processBuildResult(buildResult: BuildResult, opts: ExecuteBuilderOptions, ctx: BuilderContext) {
  return iif(
    //
    () => !buildResult.success || opts.watch,
    killProcess(ctx),
    of(undefined)
  ).pipe(tap(() => forkProcess(buildResult, opts, ctx)));
}

function startBuild(opts: ExecuteBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  const target = targetFromTargetString(opts.buildTarget);

  return from(
    Promise.all([
      //
      ctx.getTargetOptions(target),
      ctx.getBuilderNameForTarget(target),
    ]).then(([builderOpts, builderName]) => ctx.validateOptions(builderOpts, builderName))
  ).pipe(
    tap((builderOpts) => {
      if (builderOpts.optimization) {
        ctx.logger.warn(tags.stripIndents`
            ************************************************
            This is a simple process manager for use in
            testing or debugging Node applications locally.
            DO NOT USE IT FOR PRODUCTION!
            You should look into proper means of deploying
            your node application to production.
            ***********************************************
            `);
      }
    }),
    concatMap(
      (builderOpts) =>
        scheduleTargetAndForget(ctx, target, {
          ...builderOpts,
          watch: true,
        }) as Observable<BuildResult>
    )
  );
}

function runWaitUntilTargets(opts: ExecuteBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  if (!opts.waitUntilTargets || opts.waitUntilTargets.length === 0) {
    return of({ success: true });
  }

  return zip(
    ...opts.waitUntilTargets.map((targetString) => {
      return scheduleTargetAndForget(ctx, targetFromTargetString(targetString)).pipe(
        filter((output: BuilderOutput) => output.success !== undefined),
        first()
      );
    })
  ).pipe(
    map((results) => {
      return { success: !results.some((result) => !result.success) };
    })
  );
}

function forkProcess(buildResult: BuildResult, opts: ExecuteBuilderOptions, ctx: BuilderContext) {
  if (subProcess || !buildResult.success) {
    return;
  }

  subProcess = fork(buildResult.outfile, opts.args, {
    execArgv: getProcessArgv(opts),
  });
  subProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      ctx.logger.warn(`Process exited with code '${code}'.`);
    }
    subProcess = null;
  });
}

function killProcess(ctx: BuilderContext): Observable<void | Error> {
  if (!subProcess) {
    return of(undefined);
  }

  const observableTreeKill = bindCallback<number, string, Error>(treeKill);
  return observableTreeKill(subProcess.pid, 'SIGTERM').pipe(
    tap((e) => {
      subProcess = null;
      if (e) {
        if (Array.isArray(e) && e[0] && e[2]) {
          const message = e[2];
          ctx.logger.error(message);
        } else if (e.message) {
          ctx.logger.error(e.message);
        }
      }
    })
  );
}

function getProcessArgv(options: ExecuteBuilderOptions) {
  const args = ['-r', 'source-map-support/register', ...options.runtimeArgs];

  if (options.inspect === true) {
    options.inspect = InspectEnum.Inspect;
  }

  if (options.inspect) {
    args.push(`--${options.inspect}=${options.host}:${options.port}`);
  }

  return args;
}
