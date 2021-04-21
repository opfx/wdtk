import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder, targetFromTargetString } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { spawn } from 'child_process';
import * as Path from 'path';

import { Observable } from 'rxjs';
import { from } from 'rxjs';

import { concatMap, switchMap, map } from 'rxjs/operators';

import { Schema } from './schema';

export interface TestBuilderOptions extends Schema {
  projectRoot: string;
}

export default createBuilder<TestBuilderOptions & JsonObject>(execute);

export function execute(opts: TestBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(ctx.getProjectMetadata(ctx.target)).pipe(
    switchMap(async (projectMetadata) => {
      return { ...(await normalizeOptions(opts, ctx, projectMetadata)) };
    }),
    switchMap((opts) => {
      return runBuild(opts, ctx).pipe(
        concatMap(async (buildEvent) => {
          if (!buildEvent.success) {
            ctx.logger.error(`Failed to run tests: build failed.`);
            return buildEvent;
          }

          try {
            return await runTests(opts, ctx);
          } catch (e) {
            return { success: false, error: `Failed to run tests: ${e.message}` };
          }
        }),
        map((buildEvent) => {
          return { ...buildEvent };
        })
      );
    })
  );
}

function runBuild(opts: TestBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  return new Observable<BuilderOutput>((obs) => {
    const doBuild = async () => {
      const buildTarget = targetFromTargetString(opts.buildTarget);
      const buildOptions = await ctx.getTargetOptions(buildTarget);

      const buildTargetRun = await ctx.scheduleTarget(buildTarget, { ...buildOptions, watch: false });

      try {
        // throw new Error('Unknown error');

        return await buildTargetRun.result;
      } finally {
        await buildTargetRun.stop();
      }
    };

    doBuild()
      .then((result: any) => {
        if (result.errors && result.errors.length > 0) {
          obs.next({ success: false });
        } else {
          obs.next({ success: true });
        }
      })
      .catch((e) => {
        obs.next({ success: false, error: e.message });
      })
      .finally(() => {
        obs.complete();
      });
  });
}

async function runTests(opts: TestBuilderOptions, ctx: BuilderContext): Promise<BuilderOutput> {
  const args = getPhpArgs(opts);

  return new Promise((resolve) => {
    ctx.logger.debug(`spawning php with args: ${JSON.stringify(args)}`);
    const php = spawn('php', args, { cwd: opts.projectRoot });

    php.stdout.on('data', (output) => {
      output = output.toString();
      ctx.logger.info(output);
    });
    php.stderr.on('data', (output) => {
      output = output.toString();
      ctx.logger.error(output);
    });
    const handlePhpExit = (code?: number) => {
      let success = true;
      if (code && code !== 0) {
        success = false;
      }
      resolve({ success });
    };
    php.on('exit', handlePhpExit);
    php.on('SIGINT', handlePhpExit);
    php.on('uncaughtException', handlePhpExit);
  });
}

function getPhpArgs(opts: TestBuilderOptions): string[] {
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

async function normalizeOptions(opts: TestBuilderOptions, ctx: BuilderContext, projectMetadata): Promise<TestBuilderOptions> {
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
  // const projectMetadata = await ctx.getProjectMetadata(ctx.target);
  const projectRoot = Path.resolve(ctx.workspaceRoot, (projectMetadata as any).root);
  return {
    ...opts,
    projectRoot,
  };
}
