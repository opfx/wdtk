import * as path from 'path';
import * as fs from 'fs';
import { format } from 'util';
import { createConsoleLogger } from '@angular-devkit/core/node';
import { runCommand, getCommandWorkspace } from '@wdtk/core';
import { colors, removeColor, supportsColor } from '@wdtk/core/util';
import { findUp } from '@wdtk/core/util';
import { CommandNotFoundException } from '@wdtk/core';

const dbgEnv = process.env['WX_DEBUG'];

const isDebug = dbgEnv !== undefined && dbgEnv !== '0' && dbgEnv.toLowerCase() !== 'false';

export default async function (options: { cliArgs: string[] }) {
  // const version = process.versions.node.split();
  //fix verification of node version

  const logger = setupLogging();

  let workspace = getCommandWorkspace();
  if (!workspace) {
    workspace = { root: process.cwd() };
  }

  const commandsFile = findUp('commands.json', __dirname);
  const commandsJson = fs.readFileSync(commandsFile, 'utf-8');
  const commands = JSON.parse(commandsJson);

  for (const command of Object.keys(commands)) {
    commands[command] = path.resolve(__dirname, '../..', commands[command]);
  }

  const uriHandler = (uri: string) => {
    if (uri.startsWith('wx-cli://')) {
      const content = fs.readFileSync(path.join(__dirname, '../..', uri.substr('wx-cli://'.length)), 'utf-8');

      return Promise.resolve(JSON.parse(content));
    }
    return null;
  };

  try {
    let maybeExitCode;
    try {
      maybeExitCode = await runCommand(options.cliArgs, { commands, workspace, uriHandler, logger });
    } catch (x) {
      if (x instanceof CommandNotFoundException) {
        const ngCli = require.resolve('@angular/cli', { paths: [process.cwd()] });
        const cli = await import(ngCli);
        maybeExitCode = await cli.default({ cliArgs: options.cliArgs });
      }
    }
    if (typeof maybeExitCode === 'number') {
      console.assert(Number.isInteger(maybeExitCode));
      return maybeExitCode;
    }
    return 0;
  } catch (e) {
    if (e instanceof Error) {
      logger.fatal(`An unhandled exception occurred : ${e.message}`);
    }
    return 1;
  }
}

function setupLogging() {
  let verbose = false;
  const argv = process.argv;
  argv.forEach((arg) => {
    if (arg.includes('--debug') || arg.includes('--verbose')) {
      verbose = true;
    }
  });
  if (isDebug) {
    verbose = true;
  }
  const logger = createConsoleLogger(verbose, process.stdout, process.stderr, {
    info: (s) => (supportsColor ? s : removeColor(s)),
    debug: (s) => (supportsColor ? s : removeColor(s)),
    warn: (s) => (supportsColor ? colors.bold.yellow(s) : removeColor(s)),
    error: (s) => (supportsColor ? colors.bold.red(s) : removeColor(s)),
    fatal: (s) => (supportsColor ? colors.bold.red(s) : removeColor(s)),
  });

  // redirect console to logger
  console.log = function () {
    logger.info(format.apply(null, arguments));
  };
  console.info = function () {
    logger.info(format.apply(null, arguments));
  };
  console.warn = function () {
    logger.warn(format.apply(null, arguments));
  };
  console.error = function () {
    logger.error(format.apply(null, arguments));
  };
  return logger;
}
