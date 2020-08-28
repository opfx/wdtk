import * as path from 'path';
import * as fs from 'fs';
import { format } from 'util';
import { createConsoleLogger } from '@angular-devkit/core/node';
import { runCommand } from '@wdtk/core';
import { colors, removeColor, supportsColor } from '@wdtk/core/util';
import { findUp } from '@wdtk/core/util';

const dbgEnv = process.env['WX_DEBUG'];

const isDebug = dbgEnv !== undefined && dbgEnv !== '0' && dbgEnv.toLowerCase() !== 'false';

export default async function (options: { cliArgs: string[] }) {
  // const version = process.versions.node.split();
  //fix verification of node version

  const logger = setupLogging();

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
    // const maybeExitCode = await runCommand(['version'], commandMapOpts);
    const maybeExitCode = await runCommand(options.cliArgs, { commands, uriHandler });
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
  const logger = createConsoleLogger(isDebug, process.stdout, process.stderr, {
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
