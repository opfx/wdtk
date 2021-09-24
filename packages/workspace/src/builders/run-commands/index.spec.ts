import { Architect } from '@angular-devkit/architect';

import { createMockArchitect } from '@wdtk/core/testing';

import { readFileSync, existsSync, unlinkSync, exists } from 'fs';
import * as Os from 'os';
import * as Path from 'path';

const builder = '@wdtk/workspace:run-commands';

function readFile(f: string) {
  return readFileSync(f).toString().replace(/\s/g, '');
}

describe(`run-commands`, () => {
  let architect: Architect;
  beforeEach(async () => {
    architect = await createMockArchitect('@wdtk/workspace');
  });

  it(`should run one command`, async () => {
    const f = Path.join(Os.tmpdir(), 'run-commands.txt');
    const run = await architect.scheduleBuilder(builder, { command: `echo 1 > ${f}` });
    const result = await run.result;
    expect(result.success).toBe(true);
    expect(readFile(f)).toEqual('1');
  });

  it(`should interpolate provide --args`, async () => {
    const f = Path.join(Os.tmpdir(), 'run-commands.txt');
    const run = await architect.scheduleBuilder(builder, {
      command: `echo {args.key} > ${f}`,
      args: '--key=123',
    });
    const result = await run.result;
    expect(result.success).toBe(true);
    expect(readFile(f)).toEqual('123');
  });

  it(`should interpolate all unknown args as if they were --args`, async () => {
    const f = Path.join(Os.tmpdir(), 'run-commands.txt');
    const run = await architect.scheduleBuilder(builder, {
      command: `echo {args.key} > ${f}`,
      key: '123',
    });
    const result = await run.result;
    expect(result.success).toBe(true);
    expect(readFile(f)).toEqual('123');
  });

  it(`should add all args to the command if no interpolation in the command`, async () => {
    const spawn = jest.spyOn(require('child_process'), 'spawn');

    const run = await architect.scheduleBuilder(builder, {
      command: `echo`,
      a: 123,
      b: 456,
    });
    const result = await run.result;
    expect(spawn).toHaveBeenCalledWith(`echo --a=123 --b=456`, [], expect.objectContaining({ shell: true }));
  });

  it(`should forward args by default when using commands (plural)`, async () => {
    const spawn = jest.spyOn(require('child_process'), 'spawn');

    const run = await architect.scheduleBuilder(builder, {
      commands: [{ command: `echo` }],
      a: 123,
      b: 456,
    });
    const result = await run.result;
    expect(spawn).toHaveBeenCalledWith(`echo --a=123 --b=456`, [], expect.objectContaining({ shell: true }));
  });

  it(`should forward args when forwardAllArgs is set to true`, async () => {
    const spawn = jest.spyOn(require('child_process'), 'spawn');

    const run = await architect.scheduleBuilder(builder, {
      commands: [{ command: `echo`, forwardAllArgs: true }],
      a: 123,
      b: 456,
    });
    const result = await run.result;
    expect(spawn).toHaveBeenCalledWith(`echo --a=123 --b=456`, [], expect.objectContaining({ shell: true }));
  });

  it(`should not forward args when forwardAllArgs is set to false`, async () => {
    const spawn = jest.spyOn(require('child_process'), 'spawn');

    const run = await architect.scheduleBuilder(builder, {
      commands: [{ command: `echo`, forwardAllArgs: false }],
      a: 123,
      b: 456,
    });
    const result = await run.result;
    expect(spawn).toHaveBeenCalledWith(`echo`, [], expect.objectContaining({ shell: true }));
  });

  it(`should throw when invalid args`, async () => {
    try {
      const run = await architect.scheduleBuilder(builder, {
        command: `echo {args.key}`,
        args: 'key=value',
      });
      await run.result;
    } catch (e) {
      expect(e.message).toEqual('Invalid args: key=value');
    }
  });

  it(`should run commands serially`, async () => {
    jest.setTimeout(30000);
    const f = Path.join(Os.tmpdir(), 'run-commands.serially.txt');

    if (existsSync(f)) {
      unlinkSync(f);
    }
    let sleepCmd = 'sleep 1';
    if (Os.platform() === 'win32') {
      sleepCmd = 'ping -n 10 127.0.0.1';
    }
    const run = await architect.scheduleBuilder(builder, {
      // commands: [`${sleepCmd} && echo 1 >> ${f}`, `echo 2 >> ${f}`],
      commands: [`${sleepCmd} && echo 1 >> ${f}`, `echo 2 >> ${f}`],
      parallel: false,
      verbose: true,
    });
    const result = await run.result;
    expect(result.success).toBe(true);
    expect(readFile(f)).toEqual('12');
  });

  it(`should run command in parallel`, async () => {
    jest.setTimeout(30000);
    const f = Path.join(Os.tmpdir(), 'run-commands.txt');

    if (existsSync(f)) {
      unlinkSync(f);
    }
    let sleepCmd = 'sleep 1';
    if (Os.platform() === 'win32') {
      sleepCmd = 'ping -n 10 127.0.0.1';
    }
    const run = await architect.scheduleBuilder(builder, {
      commands: [{ command: `${sleepCmd} && echo 1 >> ${f}` }, { command: `echo 2 >> ${f}` }],
      parallel: true,
    });
    const result = await run.result;
    expect(result.success).toBe(true);
    const content = readFile(f);
    expect(content).toContain('21');
  });

  it(`should stop execution when a command fails`, async () => {
    jest.setTimeout(30000);
    const f = Path.join(Os.tmpdir(), 'run-commands.txt');

    if (existsSync(f)) {
      unlinkSync(f);
    }

    let sleepCmd = 'sleep 1';
    if (Os.platform() === 'win32') {
      sleepCmd = 'ping -n 10 127.0.0.1';
    }

    const run = await architect.scheduleBuilder(builder, {
      commands: [
        { command: `echo 1 >> ${f}  && echox` }, //

        { command: `${sleepCmd} && echo 2 >> ${f}` },
      ],
      parallel: true,
    });
    const result = await run.result;

    expect(result.success).toBe(false);
    expect(readFile(f)).toEqual('1');
  });

  it(`run the command in the specified working directory`, async () => {
    const f = Path.join(Os.tmpdir(), 'run-commands.cwd.txt');
    let cmd = 'pwd';
    if (Os.platform() === 'win32') {
      cmd = 'echo %cd%';
    }
    const runA = await architect.scheduleBuilder(builder, {
      commands: [{ command: `${cmd} > ${f}` }],
    });
    const resultA = await runA.result;
    expect(resultA.success).toBe(true);
    expect(readFile(f)).not.toContain('projects');

    const runB = await architect.scheduleBuilder(builder, {
      commands: [{ command: `${cmd} > ${f}` }],
      cwd: 'projects',
    });
    const resultB = await runB.result;
    expect(resultB.success).toBe(true);
    expect(readFile(f)).toContain('projects');
  });
});
