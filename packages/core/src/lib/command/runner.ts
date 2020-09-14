import { readFileSync } from 'fs';
import * as path from 'path';

import { Logger } from '@wdtk/core/util';
import { strings, tags } from '@wdtk/core/util';

import { CoreSchemaRegistry, JsonParseMode, JsonObject, UriHandler } from './../json';
import { isJsonObject, parseJson } from './../json';

import { CommandDescriptor, SubCommandDescriptor, CommandMapOptions, CommandWorkspace, CommandMap } from './types';
import { CommandNotFoundException } from './exceptions';
import { Command } from './command';

import { parseJsonSchemaToCommandDescriptor } from './schema';
import { parseArguments } from './arguments';
import { ParseArgumentException } from './arguments';

export interface RunCommandOptions {
  uriHandler: UriHandler;
  commands: CommandMap;
  workspace: CommandWorkspace;
  log?: Logger;
}

export async function runCommand(args: string[], opts: RunCommandOptions): Promise<number | void> {
  const commands = opts.commands;
  const uriHandler = opts.uriHandler;
  let log: Logger;
  if (opts.log) {
    log = opts.log;
  } else {
    log = Logger.getLogger();
  }

  const registry = new CoreSchemaRegistry([]);
  registry.registerUriHandler(uriHandler);

  let commandName: string | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('-')) {
      commandName = arg;
      args.splice(i, 1);
      break;
    }
  }

  let descriptor: CommandDescriptor | null = null;

  if (!commandName) {
    if (args.length === 1 && args[0] === '-version') {
      commandName = 'version';
    } else {
      commandName = 'help';
    }
    if (!(commandName in commands)) {
      log.error(`The command '${commandName}' seems to be disabled.`);
    }
  }

  if (commandName in commands) {
    descriptor = await loadCommandDescriptor(commandName, commands[commandName], registry);
  } else {
    const commandNames = Object.keys(commands);

    // optimize loading for common aliases
    if (commandName.length === 1) {
      commandNames.sort((a, b) => {
        const aMatch = a[0] === commandName;
        const bMatch = b[0] === commandName;
        if (aMatch && !bMatch) {
          return -1;
        }
        if (!aMatch && bMatch) {
          return 1;
        }
        return 0;
      });
    }

    for (const name of commandNames) {
      const aliasDesc = await loadCommandDescriptor(name, commands[name], registry);
      const aliases = aliasDesc.aliases;

      if (aliases && aliases.some((alias) => alias === commandName)) {
        commandName = name;
        descriptor = aliasDesc;
        break;
      }
    }
  }

  if (!descriptor) {
    throw new CommandNotFoundException(commandName);
  }

  try {
    const parsedArguments = parseArguments(args, descriptor.options, log);
    Command.setCommandMap(async () => {
      const map: Record<string, CommandDescriptor> = {};
      for (const [name, schemaPath] of Object.entries(commands)) {
        map[name] = await loadCommandDescriptor(name, schemaPath, registry);
      }
      return map;
    });

    const ctx = { workspace: opts.workspace };
    const command = new descriptor.impl(ctx, descriptor, log);

    const result = await command.validateAndRun(parsedArguments);

    return result;
  } catch (e) {
    if (e instanceof ParseArgumentException) {
      if (log) {
        log.fatal(`Cannot parse arguments. See below for the reasons.`);
        log.fatal(`    ${e.comments.join('\n')}`);
      }
      return 1;
    }
    if (log) {
      log.fatal(`${e.message}`);
    }
    throw e;
  }
}

/**
 * Returns the command name or alias from the list of arguments.
 * @param args
 */
export function getCommandName(args: string[]): string {
  let commandName: string | undefined = undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('-')) {
      commandName = arg;
      break;
    }
  }
  return commandName;
}

export async function getCommandDescriptor(args: string[], commands: CommandMap, registry: CoreSchemaRegistry): Promise<CommandDescriptor> {
  let descriptor: CommandDescriptor | null = null;
  let commandName: string | undefined = getCommandName(args);

  if (!commandName) {
    if (args.length === 1 && args[0] === '-version') {
      commandName = 'version';
    } else {
      commandName = 'help';
    }
  }

  if (commandName in commands) {
    descriptor = await loadCommandDescriptor(commandName, commands[commandName], registry);
  } else {
    const commandNames = Object.keys(commands);

    // optimize loading for common aliases
    if (commandName.length === 1) {
      commandNames.sort((a, b) => {
        const aMatch = a[0] === commandName;
        const bMatch = b[0] === commandName;
        if (aMatch && !bMatch) {
          return -1;
        }
        if (!aMatch && bMatch) {
          return 1;
        }
        return 0;
      });
    }

    for (const name of commandNames) {
      const aliasDesc = await loadCommandDescriptor(name, commands[name], registry);
      const aliases = aliasDesc.aliases;

      if (aliases && aliases.some((alias) => alias === commandName)) {
        commandName = name;
        descriptor = aliasDesc;
        break;
      }
    }
  }
  return descriptor;
}

async function loadCommandDescriptor(name: string, schemaPath: string, registry: CoreSchemaRegistry): Promise<CommandDescriptor> {
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  const schema = parseJson(schemaContent, JsonParseMode.Loose, { path: schemaPath });
  if (!isJsonObject(schema)) {
    throw new Error(`Invalid command JSON loaded from '${JSON.stringify(schemaPath)}'`);
  }
  return parseJsonSchemaToCommandDescriptor(name, schemaPath, registry, schema);
}
