import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';

// import {ForkOptions,fork} from 'child_process';

import { SpawnOptions, spawn } from 'child_process';

import { Observable } from 'rxjs';

export type BuildResult = BuilderOutput;

const defaultSpawnOpts: SpawnOptions = {
  stdio: 'inherit',
};

export function runPhp(args: string[], opts: SpawnOptions, ctx: BuilderContext): Observable<BuildResult> {
  const spawnOpts = { ...defaultSpawnOpts, ...opts };
  const spawnArgs = args;

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
