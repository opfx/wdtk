import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { normalize, isAbsolute, join, getSystemPath } from '@angular-devkit/core';

import { SpawnOptions } from 'child_process';
import { spawn } from 'child_process';

import { Observable, Subscription } from 'rxjs';
import { of, from, forkJoin } from 'rxjs';
import { concatMap, switchMap, map, mergeMap } from 'rxjs/operators';

import { Schema } from './schema';
import { CommandElement, CommandClass } from './schema';

export interface RunCommandsBuilderOptions extends Schema {
  args?: string;
  parsedArgs: { [k: string]: any };
}

export default createBuilder<RunCommandsBuilderOptions & JsonObject>(execute);

const propKeys = getPropertyKeys();

function execute(opts: RunCommandsBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(normalizeOptions(opts, ctx)).pipe(switchMap((opts) => runCommands(opts, opts.cwd, ctx)));
}

function runCommands(opts: RunCommandsBuilderOptions, cwd: string, ctx: BuilderContext): Observable<BuilderOutput> {
  let subscription: Subscription;
  const executeMap = opts.parallel ? mergeMap : concatMap;

  const commands = from(opts.commands).pipe(
    executeMap((command) => {
      return runCommand(command, opts.cwd, ctx);
    })
  );

  return new Observable((observer) => {
    subscription = commands.subscribe({
      next: (v) => {},
      complete: () => {
        observer.next({ success: true });
        observer.complete();
      },
      error: (e) => {
        observer.next({ success: false });
        observer.complete();
      },
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  });
}

function runCommand(opts, cwd: string, ctx: BuilderContext): Observable<BuilderOutput> {
  const spawnOpts: SpawnOptions = {
    cwd: cwd || process.cwd(),
    shell: true,
    stdio: 'inherit',
  };
  const spawnArgs = [];
  // if (!opts.args) {
  //   spawnArgs = opts.args;
  // }
  return new Observable<BuilderOutput>((observer) => {
    ctx.logger.debug(`executing '${opts.command}' in '${spawnOpts.cwd}' directory; args: ${JSON.stringify(opts.args)} `);
    const cmdProcess = spawn(opts.command, spawnArgs, spawnOpts);

    ctx.logger.debug(`started '${opts.command}' pid: ${cmdProcess.pid}`);

    const killCmdProcess = () => {
      ctx.logger.debug(`stopping '${opts.command}' pid: ${cmdProcess.pid}`);
      if (cmdProcess && cmdProcess.pid) {
        cmdProcess.kill();
      }
    };

    // handle process exit
    const handleCmdProcessExit = (code?: number) => {
      let output: BuilderOutput = { success: true };
      killCmdProcess();
      if (code && code !== 0) {
        // output = { success: false, error: 'Build failed. See above for details.' };
        observer.error();
        observer.complete();
        return;
      }
      observer.next(output);
      observer.complete();
    };

    cmdProcess.on('exit', handleCmdProcessExit);
    cmdProcess.on('SIGINT', handleCmdProcessExit);
    cmdProcess.on('uncaughtException', handleCmdProcessExit);

    // teardown logic
    return killCmdProcess;
  });
}

async function normalizeOptions(opts: RunCommandsBuilderOptions, ctx: BuilderContext): Promise<any> {
  opts.parsedArgs = parseArgs(opts);

  if (opts.command) {
    opts.commands = [{ command: opts.command }];
    opts.parallel = false;
  } else {
    (<any>opts).commands = opts.commands.map((c) => {
      return typeof c === 'string' ? { command: c } : c;
    });
  }
  opts.commands.forEach((c: CommandClass) => {
    c.command = normalizeCommand(c.command, opts.parsedArgs, c.forwardAllArgs ?? true);
  });

  if (opts.cwd) {
    let cwd = normalize(opts.cwd);
    if (!isAbsolute(cwd)) {
      cwd = join(normalize(ctx.workspaceRoot), cwd);
    }
    opts.cwd = getSystemPath(cwd);
  }

  return opts;
}

function normalizeCommand(command: string, args: { [key: string]: string }, forwardAllArgs: boolean) {
  if (command.indexOf('{args.') > -1) {
    const regex = /{args\.([^}]+)}/g;
    return command.replace(regex, (_, group: string) => args[group]);
  } else if (Object.keys(args).length > 0 && forwardAllArgs) {
    const stringifiedArgs = Object.keys(args)
      .map((a) => `--${a}=${args[a]}`)
      .join(' ');
    return `${command} ${stringifiedArgs}`;
  } else {
    return command;
  }
}

function parseArgs(opts: RunCommandsBuilderOptions) {
  const args = opts.args;
  if (!args) {
    const unknownOptionsTreatedAsArgs = Object.keys(opts)
      .filter((p) => propKeys.indexOf(p) === -1)
      .reduce((m, c) => ((m[c] = opts[c]), m), {});
    return unknownOptionsTreatedAsArgs;
  }
  return args
    .split(' ')
    .map((t) => t.trim())
    .reduce((m, c) => {
      if (!c.startsWith('--')) {
        throw new Error(`Invalid args: ${args}`);
      }
      const [key, value] = c.substring(2).split('=');
      if (!key || !value) {
        throw new Error(`Invalid args: ${args}`);
      }
      m[key] = value;
      return m;
    }, {});
}

function getPropertyKeys() {
  const schema = require('./schema.json');
  return Object.keys(schema.properties);
}
