import { readFileSync } from 'fs';
import * as path from 'path';

import { schema } from '@angular-devkit/core';
import { Logger } from '@wdtk/core/util';

import { parseJson, JsonParseMode, JsonObject } from './../json';
import { isJsonObject } from './../json';

import { CommandDescriptor, SubCommandDescriptor, CommandMapOptions, CommandWorkspace, CommandMap } from './types';
import { Command } from './command';

import { parseJsonSchemaToCommandDescriptor } from './schema';
import { parseArguments } from './arguments';
import { ParseArgumentException } from './arguments';

export interface RunCommandOptions {
  uriHandler: schema.UriHandler;
  commands: CommandMap;
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

  const registry = new schema.CoreSchemaRegistry([]);
  registry.registerUriHandler(uriHandler);

  let commandName: string | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('-')) {
      commandName = arg;
      args = args.slice(i, 1);
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
  }

  if (!descriptor) {
    //FIXME
    return 1;
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

    const ctx = {};
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
    throw e;
  }
}

async function loadCommandDescriptor(
  name: string,
  schemaPath: string,
  registry: schema.CoreSchemaRegistry
): Promise<CommandDescriptor> {
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  const schema = parseJson(schemaContent, JsonParseMode.Loose, { path: schemaPath });
  if (!isJsonObject(schema)) {
    throw new Error(`Invalid command JSON loaded from '${JSON.stringify(schemaPath)}'`);
  }
  return parseJsonSchemaToCommandDescriptor(name, schemaPath, registry, schema);
}
