import { Logger } from '@wdtk/core/util';
import { JsonValue } from './../json';

/**
 * Value type of arguments.
 */
export type Value = number | string | boolean | (number | string | boolean)[];

/**
 * An object representing parsed arguments from the command line.
 */
export interface Arguments {
  [argName: string]: Value | undefined;

  /**
   * Extra arguments that were not parsed. Will be omitted if all arguments were parsed.
   */
  '--'?: string[];
}
/**
 * Value types of an Option.
 */
export enum OptionType {
  Any = 'any',
  Array = 'array',
  Boolean = 'boolean',
  Number = 'number',
  String = 'string',
}
export interface OptionSmartDefault {
  $source: string;
  [key: string]: JsonValue;
}

export interface Option {
  /**
   * The name of the option.
   */
  name: string;

  /**
   * A short description of the option.
   */
  description: string;

  /**
   * The type of option value. If multiple types exist, this type will be the first one, and the
   * types array will contain all types accepted.
   */
  type: OptionType;

  /**
   * {@see type}
   */
  types?: OptionType[];

  /**
   * If this field is set, only values contained in this field are valid. This array can be mixed
   * types (strings, numbers, boolean). For example, if this field is "enum: ['hello', true]",
   * then "type" will be either string or boolean, types will be at least both, and the values
   * accepted will only be either 'hello' or true (not false or any other string).
   * This mean that prefixing with `no-` will not work on this field.
   */
  enum?: Value[];

  /**
   * If this option maps to a subcommand in the parent command, will contain all the subcommands
   * supported. There is a maximum of 1 subcommand Option per command, and the type of this
   * option will always be "string" (no other types). The value of this option will map into
   * this map and return the extra information.
   */
  subcommands?: {
    [name: string]: SubCommandDescriptor;
  };

  /**
   * Aliases supported by this option.
   */
  aliases: string[];

  /**
   * Whether this option is required or not.
   */
  required?: boolean;

  /**
   * Format field of this option.
   */
  format?: string;

  /**
   * Whether this option should be hidden from the help output. It will still show up in JSON help.
   */
  hidden?: boolean;

  /**
   * Default value of this option.
   */
  default?: string | number | boolean;

  /**
   * If this option can be used as an argument, the position of the argument. Otherwise omitted.
   */
  positional?: number;

  /**
   * Deprecation. If this flag is not false a warning will be shown on the console. Either `true`
   * or a string to show the user as a notice.
   */
  deprecated?: boolean | string;

  /**
   * Smart default object.
   */
  $default?: OptionSmartDefault;

  /**
   * Whether or not to report this option to the Angular Team, and which custom field to use.
   * If this is falsey, do not report this option.
   */
  userAnalytics?: number;
}
/**
 * The base interface for Command, understood by the command runner.
 */
export interface CommandInterface<T extends Arguments = Arguments> {
  printHelp(options: T): Promise<number>;
  printJsonHelp(options: T): Promise<number>;
  validateAndRun(options: T): Promise<number>;
}

/**
 * Command constructor.
 */
export interface CommandConstructor {
  new (context: CommandContext, description: CommandDescriptor, log: Logger): CommandInterface;
}
export interface CommandWorkspace {
  root: string;
}
export interface CommandMap {
  [key: string]: string;
}
export interface CommandMapOptions {
  commands: CommandMap;
  path?: string;
}
// export interface CommandMapOptions {
//   [key: string]: string;
// }

/**
 * A command runner context.
 */
export interface CommandContext {
  workspace?: CommandWorkspace;
}

/**
 * Command constructor.
 */
export interface CommandConstructor {
  new (context: CommandContext, description: CommandDescriptor, logger: Logger): CommandInterface;
}
/**
 * Scope of the command.
 */
export enum CommandScope {
  InProject = 'in',
  OutProject = 'out',
  Everywhere = 'all',

  Default = InProject,
}

/**
 * A description of a command and its options.
 */
export interface SubCommandDescriptor {
  /**
   * The name of the subcommand.
   */
  name: string;

  /**
   * Short description (1-2 lines) of this sub command.
   */
  description: string;

  /**
   * A long description of the sub command, in Markdown format.
   */
  longDescription?: string;

  /**
   * Additional notes about usage of this sub command, in Markdown format.
   */
  usageNotes?: string;

  /**
   * List of all supported options.
   */
  options: Option[];

  /**
   * Aliases supported for this sub command.
   */
  aliases: string[];
}
export interface CommandDescriptor extends SubCommandDescriptor {
  /**
   * Scope of the command, whether it can be executed in a project, outside of a project or
   * anywhere.
   */
  scope: CommandScope;

  /**
   * Whether this command should be hidden from a list of all commands.
   */
  hidden: boolean;

  /**
   * The constructor of the command, which should be extending the abstract Command<> class.
   */
  impl: CommandConstructor;
}

export interface CommandDescriptorMap {
  [key: string]: CommandDescriptor;
}
