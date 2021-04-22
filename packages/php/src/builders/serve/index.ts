import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { spawn, SpawnOptions } from 'child_process';
import * as Path from 'path';
import * as File from 'fs';

import { Observable } from 'rxjs';
import { from, of } from 'rxjs';
import { catchError, concatMap, switchMap, map } from 'rxjs/operators';

import { Schema } from './schema';

export interface ServeBuilderOptions extends Schema {}

export default createBuilder<ServeBuilderOptions & JsonObject>(execute);

export function execute(opts: ServeBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(ctx.getProjectMetadata(ctx.target)).pipe(
    switchMap(async (projectMetadata) => {
      opts = await normalizeOptions(opts, ctx, projectMetadata);
      await initialize(opts, ctx);
      return opts;
    }),
    switchMap((opts) => {
      return runBuild(opts, ctx).pipe(
        concatMap((buildEvent) => {
          if (!buildEvent.success) {
            return of(buildEvent);
          }
          return runDevServer(opts, ctx);
        }),
        map((buildEvent) => {
          return buildEvent;
        })
      );
    })
  );
}

function runBuild(opts: ServeBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  return new Observable<BuilderOutput>((obs) => {
    obs.next({ success: true });
    obs.complete();
  });
}

function runDevServer(opts: ServeBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  const args = getPhpArgs(opts);
  return new Observable<BuilderOutput>((obs) => {
    ctx.logger.debug(`spawning php process with args: ${JSON.stringify(args)}`);

    const phpDevServer = spawn('php', args, { cwd: opts.docRoot! });

    ctx.logger.debug(`php dev server was spawned (pid: ${phpDevServer.pid})`);

    // hookup output handlers
    phpDevServer.stdout.on('data', (output) => {
      output = output.toString();
      ctx.logger.info(output);
    });

    phpDevServer.stderr.on('data', (output) => {
      output = output.toString();
      ctx.logger.error(output);
    });

    const tearDownPhpDevServer = () => {
      if (phpDevServer && phpDevServer.pid) {
        ctx.logger.debug(`stopping php dev server (pid: ${phpDevServer.pid})`);
        phpDevServer.kill();
      }
    };

    const handlePhpDevServerExit = (code?: number) => {
      ctx.logger.debug(`php dev server process exited (code: ${code})`);
      if (!code || code !== 0) {
        obs.next({ success: false, error: `PHP dev server exited unexpectedly` });
      } else {
        obs.next({ success: true });
      }
      obs.complete();
    };

    phpDevServer.on('exit', handlePhpDevServerExit);
    phpDevServer.on('SIGINT', handlePhpDevServerExit);
    phpDevServer.on('uncaughtException', handlePhpDevServerExit);

    // return tear down logic
    return tearDownPhpDevServer;
  });
}

function getPhpArgs(opts: ServeBuilderOptions): string[] {
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

async function initialize(opts: ServeBuilderOptions, ctx: BuilderContext): Promise<any> {
  // create the xdebug output dir
  if (opts.debug.outputDir && opts.debug.mode !== 'off') {
    if (!File.existsSync(opts.debug.outputDir)) {
      ctx.logger.debug(` ∙ creating xdebug output directory '${opts.debug.outputDir}'`);
      File.mkdirSync(opts.debug.outputDir, { recursive: true });
    }
  }

  return opts;
}

async function normalizeOptions(opts: ServeBuilderOptions, ctx: BuilderContext, projectMetadata: any): Promise<any> {
  const projectRoot = Path.resolve(ctx.workspaceRoot, projectMetadata.root);

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
