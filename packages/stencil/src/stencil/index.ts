import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';

import { Observable } from 'rxjs';
import { of } from 'rxjs';

export type BuildResult = BuilderOutput;

export function getStencilArgs(opts: any = {}): string[] {
  const args: string[] = [];
  args.push(opts.command);
  if (opts.config) {
    args.push('--config');
    args.push(opts.config);
  }
  if (opts.serve) {
    args.push('--serve');
  }

  if (opts.command === 'test') {
    args.push(opts.testFlag);
  }

  if (opts.watch) {
    args.push('--watch');
  }

  if (opts['--']) {
    if (Array.isArray(opts['--'])) {
      opts['--'].forEach((arg) => {
        args.push(arg);
      });
    }
  }
  return args;
}

export function runStencil(args: string[], ctx: BuilderContext): Observable<BuildResult> {
  const cli = require('@stencil/core/cli/index.cjs');
  let nodeApi = require('@stencil/core/sys/node/index.js');
  const nodeLogger = nodeApi.createNodeLogger({ process: process });
  let nodeSys = nodeApi.createNodeSys({ process: process, logger: nodeLogger });

  nodeApi.setupNodeProcess({ process: process, logger: nodeLogger });

  return new Observable<BuildResult>((obs) => {
    // intercept calls to sys.exit, and instead of exiting right away return the exitCode; the exitCode is trapped in the then handler
    // allowing the builder to finish gracefully even in cases when stencil would normally just crash exit
    let hadErrors = false;
    nodeSys.exit = async (exitCode) => {
      if (exitCode > 0) {
        hadErrors = true;
      }
      return exitCode;
    };
    ctx.logger.debug(`invoking stencil with ${JSON.stringify(args)}`);

    try {
      cli
        .run({
          // args: ['build', '--config', 'projects/test-lib/stencil.config.ts', '--debug'],
          args,
          logger: nodeLogger,
          sys: nodeSys,
          checkVersion: nodeApi.checkVersion,
        })
        .then((exitCode) => {
          let error = undefined;
          const success = !exitCode && !hadErrors ? true : false;
          if (!success) {
            error = 'The build failed. See above for details.';
          }
          obs.next({ success, error });
          obs.complete();
        });
    } catch (e) {
      if (e) {
        ctx.logger.error(`\nAn error occurred during the build:\n${(e && e.stack) || e}`);
      }
      throw e;
    }
  });
}
