import * as fs from 'fs';
import * as path from 'path';

import { SemVer } from '@wdtk/core/util';
import { findUp, strings, tags } from '@wdtk/core/util';

import { CoreSchemaRegistry, CommandMap, CommandDescriptor } from '@wdtk/core';
import { getCommandDescriptor, getCommandName } from '@wdtk/core';

const dbgEnv = process.env['WX_DEBUG'];

const isDebug = dbgEnv !== undefined && dbgEnv !== '0' && dbgEnv.toLowerCase() !== 'false';
const devVersion = new SemVer('0.0.0');

interface CliInfo {
  path: string;
  version: SemVer;
}

const clis = {
  wx: {
    name: '@wdtk/cli',
    info: null,
  },
  ng: {
    name: '@angular/cli',
    info: null,
  },
};

(async () => {
  const argv: string[] = process.argv.slice(2);

  // if we don't have a local (workspace) copy of the cli use the global one
  // otherwise always use the local copy
  for (const cli in clis) {
    const globalCliInfo = getCliInfo(clis[cli]['name'], 'global');
    const localCliInfo = getCliInfo(clis[cli]['name'], 'local');
    if (!localCliInfo.path) {
      clis[cli]['info'] = globalCliInfo;
      if (isDebug) {
        console.debug(`using global '${cli}' : ${clis[cli]['name']}@${clis[cli]['info'].version}`);
      }
    } else {
      clis[cli]['info'] = localCliInfo;
      if (isDebug) {
        console.debug(`using local '${cli}' : ${clis[cli]['name']}@${clis[cli]['info'].version}`);
      }
    }
  }

  // get the commands supported by each cli
  for (const cli in clis) {
    clis[cli]['commands'] = getCliCommandMap(clis[cli]['info']);
  }

  // find out which cli supports the given command
  // if all support it, the wx copy of the command should be executed
  let registry = new CoreSchemaRegistry([]);
  registry.registerUriHandler((uri: string) => {
    if (uri.startsWith('wx-cli://')) {
      const content = fs.readFileSync(path.join(__dirname, '..', uri.substr('wx-cli://'.length)), 'utf-8');
      return Promise.resolve(JSON.parse(content));
    }
    if (uri.startsWith('ng-cli://')) {
      const content = fs.readFileSync(path.join(clis.ng['info'].path, uri.substr('ng-cli://'.length)), 'utf-8');

      return Promise.resolve(JSON.parse(content));
    }
    return null;
  });

  let commandDescriptor: CommandDescriptor = null;
  let commandCli = null;
  for (const cli in clis) {
    commandDescriptor = await getCommandDescriptor(argv, clis[cli]['commands'], registry);
    if (commandDescriptor) {
      commandCli = clis[cli];
      break;
    }
  }

  // none of the cli support the command
  // display a help message and exit
  if (!commandDescriptor) {
    // get the command name
    let name = getCommandName(argv);

    if (!name) {
      // this should never happen
      process.exit(1);
    }

    // merge all the commands
    let commands: CommandMap = {};

    for (const cli in clis) {
      const cliCommands = clis[cli]['commands'];
      commands = { ...cliCommands, ...commands };
    }

    const commandsDistance = {} as { [name: string]: number };

    const allCommands = Object.keys(commands).sort((a, b) => {
      if (!(a in commandsDistance)) {
        commandsDistance[a] = strings.levenshtein(a, name);
      }
      if (!(b in commandsDistance)) {
        commandsDistance[b] = strings.levenshtein(b, name);
      }
      return commandsDistance[a] - commandsDistance[b];
    });

    console.error(tags.stripIndents`
    The specified command ("${name}") is invalid. For a list of available options,
    run "wx help".
    Did you mean "${allCommands[0]}"?
    `);

    process.exit(1);
  }

  if (isDebug) {
    console.debug(`using ${commandCli.name}@${commandCli.info.version} to execute '${commandDescriptor.name}' command`);
  }

  // invoke the cli that supports the command
  invokeCli(commandCli);
})()
  .then(() => {})
  .catch((e) => {
    console.error(e.message);
    console.error(e.stack);
    process.exit(127);
  });

function invokeCli(commandCli: any) {
  let commandCliInit = commandCli.info.path;
  let commandCliInitExtension = '.js';
  const fragments = [];

  if (commandCli.info.version.compare(devVersion) === 0) {
    fragments.push('src');
    commandCliInitExtension = '.ts';
  }
  fragments.push('lib');
  fragments.push(`init${commandCliInitExtension}`);
  commandCliInit = path.resolve(commandCli.info.path, ...fragments);

  if (isDebug) {
    console.debug(`loading cli from ${commandCliInit}`);
  }
  require(commandCliInit);
}

function getCliCommandMap(cliInfo: CliInfo): CommandMap {
  let commandsPath = cliInfo.path;

  // if the version of wx being loaded is a development version
  // adjust the path to the command's schema to account for
  // the 'src' dir
  let srcDir = '';

  if (cliInfo.version.compare(devVersion) === 0) {
    srcDir = 'src';
  }

  const commandsFile = path.resolve(commandsPath, 'commands.json');
  const commandsJson = fs.readFileSync(commandsFile, 'utf-8');
  const commands = JSON.parse(commandsJson);
  for (const command of Object.keys(commands)) {
    commands[command] = path.resolve(commandsPath, srcDir, commands[command]);
  }
  return commands;
}

function getCliInfo(name: string, type: 'local' | 'global'): CliInfo {
  let cliInfo = { path: null, version: null };
  let cliPath;
  try {
    if (type === 'local') {
      cliPath = require.resolve(name, { paths: [process.cwd()] });
    } else {
      cliPath = require.resolve(name);
    }
    const packageJsonPath = findUp('package.json', cliPath);

    const packageJson = require(packageJsonPath);
    cliInfo.path = path.dirname(packageJsonPath);
    cliInfo.version = new SemVer(packageJson['version']);
  } catch {}
  return cliInfo;
}