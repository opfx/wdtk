import * as Path from 'path';
import { Logger } from '@wdtk/core/util';
import { colors, strings, tags } from '@wdtk/core/util';
import { Arguments, Option, SubCommandDescriptor } from './types';
import { CommandContext, CommandDescriptor, CommandDescriptorMap, CommandScope, CommandWorkspace } from './types';

export interface CommandOptions {
  help?: boolean | string;
}
export abstract class Command<T extends CommandOptions = CommandOptions> {
  public allowMissingWorkspace = false;
  public workspace: CommandWorkspace;

  protected static commandMap: () => Promise<CommandDescriptorMap>;
  static setCommandMap(map: () => Promise<CommandDescriptorMap>) {
    this.commandMap = map;
  }

  constructor(ctx: CommandContext, public readonly descriptor: CommandDescriptor, protected readonly log: Logger) {
    this.workspace = ctx.workspace;
  }

  async initialize(options: T & Arguments): Promise<void> {
    return;
  }

  protected async validateScope(scope?: CommandScope): Promise<void> {
    switch (scope === undefined ? this.descriptor.scope : scope) {
      case CommandScope.OutWorkspace:
        if (this.workspace.configFile) {
          this.log.fatal(tags.oneLine`
          The '${this.descriptor.name}' command requires to be run outside of a workspace,
          but a workspace definition was found at '${Path.join(this.workspace.root, this.workspace.configFile)}'.`);
          throw 1;
        }
        break;
      case CommandScope.InWorkspace:
        if (this.workspace.configFile) {
          this.log.fatal(tags.oneLine`
          The '${this.descriptor.name}' command requires to be run in a workspace,
          but a workspace definition could not be found.
          `);
          throw 1;
        }

        break;
    }
  }

  abstract async run(args: T & Arguments): Promise<number | void>;

  async validateAndRun(args: T & Arguments): Promise<number | void> {
    if (!(args.help === true || args.help === 'json' || args.help === 'JSON')) {
      await this.validateScope();
    }
    await this.initialize(args);

    if (args.help === true) {
      return this.printHelp();
    }
    if (args.help === 'json' || args.help === 'JSON') {
      return this.printHelpJson();
    }
    const result = await this.run(args);
    return result;
  }

  async printHelp(): Promise<number> {
    await this.printHelpUsage();
    await this.printHelpOptions();
    return 0;
  }

  async printHelpJson(): Promise<number> {
    this.log.info(JSON.stringify(this.descriptor));
    return 0;
  }

  protected async printHelpSubCommand(subCommand: SubCommandDescriptor) {
    this.log.info(subCommand.description);
    await this.printHelpOptions(subCommand.options);
  }

  protected async printHelpUsage() {
    this.log.info(this.descriptor.description);

    const name = this.descriptor.name;
    const args = this.descriptor.options.filter((x) => x.positional !== undefined);
    const opts = this.descriptor.options.filter((x) => x.positional === undefined);

    const argDisplay = args && args.length > 0 ? ' ' + args.map((a) => `<${a.name}>`).join(' ') : '';
    const optDisplay = opts && opts.length > 0 ? ` [options]` : ``;
    this.log.info(`usage: wx ${name}${argDisplay}${optDisplay}`);
    this.log.info('');
  }

  protected async printHelpOptions(options: Option[] = this.descriptor.options) {
    const args = options.filter((o) => o.positional !== undefined);
    const opts = options.filter((o) => o.positional === undefined);

    const formatDescription = (description: string) => `    ${description.replace(/\n/g, '\n    ')}`;

    if (args.length > 0) {
      this.log.info(`arguments:`);
      args.forEach((a) => {
        this.log.info(`  ${colors.cyan(a.name)}`);
        if (a.description) {
          this.log.info(formatDescription(a.description));
        }
      });
    }
    if (opts.length) {
      if (args.length > 0) {
        this.log.info('');
      }
      this.log.info(`options:`);
      opts
        .filter((o) => !o.hidden)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((o) => {
          const aliases = o.aliases && o.aliases.length > 0 ? '(' + o.aliases.map((a) => `-${a}`).join(' ') + ')' : '';
          this.log.info(`  ${colors.cyan('--' + strings.dasherize(o.name))} ${aliases}`);
          if (o.description) {
            this.log.info(formatDescription(o.description));
          }
        });
    }
  }
}
