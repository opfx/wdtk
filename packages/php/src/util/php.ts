import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';

// import {ForkOptions,fork} from 'child_process';

import { SpawnOptions, spawn } from 'child_process';

import { Observable } from 'rxjs';

export type BuildResult = BuilderOutput;

export function runPhp(opts: any, ctx: BuilderContext): Observable<BuildResult> {
  const spawnOpts: SpawnOptions = {
    // cwd: opts.docRoot,
    // shell: true, // if shell is set to true spawn will report the shell's pid instead of php's
    stdio: 'inherit',
  };
  // const spawnArgs = ['-S', 'localhost:8000', opts.index];
  const spawnArgs = ['-S', 'localhost:8000', '-t', opts.docRoot];

  return new Observable<BuildResult>((obs) => {
    ctx.logger.debug(`spawning php process with args ${JSON.stringify(spawnArgs)}`);

    const phpProcess = spawn('php', spawnArgs, spawnOpts);

    ctx.logger.debug(`php pid ${phpProcess.pid}`);

    const killPhpProcess = () => {
      if (phpProcess && phpProcess.pid) {
        ctx.logger.debug(`killing php process ${phpProcess.pid}`);
        phpProcess.kill();
      }
    };

    // handle child process exit
    const handlePhpProcessExit = (code?: number) => {
      ctx.logger.debug(`php process exited with code ${code}`);
      killPhpProcess();
      if (code && code !== 0) {
        obs.next({ success: false, error: `PHP exited unexpectedly` });
      } else {
        obs.next({ success: true });
      }
      obs.complete();
    };
    phpProcess.on('exit', handlePhpProcessExit);
    phpProcess.on('SIGINT', handlePhpProcessExit);
    phpProcess.on('uncaughtException', handlePhpProcessExit);

    // teardown
    return killPhpProcess;
  });
}
