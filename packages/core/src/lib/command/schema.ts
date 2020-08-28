/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import { ExportStringRef } from './../export-string-ref';
import { JsonArray, JsonObject, JsonPointer, JsonValue } from './../json';
import { CoreSchemaRegistry, SchemaRegistry } from './../json';
import { getTypesOfSchema, parseJsonPointer, visitJsonSchema } from './../json';
import { isJsonArray, isJsonObject } from './../json';
import { Option, OptionType, Value, CommandScope, CommandConstructor } from './types';
import { SubCommandDescriptor, CommandDescriptor } from './types';
import { CommandJsonPathException } from './exceptions';

export async function parseJsonSchemaToCommandDescriptor(
  name: string,
  jsonPath: string,
  registry: CoreSchemaRegistry,
  schema: JsonObject
): Promise<CommandDescriptor> {
  const subCommand = await parseJsonSchemaToSubCommandDescriptor(name, jsonPath, registry, schema);

  if (typeof schema.$impl !== 'string') {
    throw new Error(`Command '${name}' does not provide a valid implementation.`);
  }
  const ref = new ExportStringRef<CommandConstructor>(schema.$impl, dirname(jsonPath));
  const impl = ref.ref;

  if (impl === undefined || typeof impl !== 'function') {
    throw new Error(`Command '${name}' does not provide a valid implementation.`);
  }

  const scope = getEnumFromValue(schema.$scope, CommandScope, CommandScope.Default);
  const hidden = !!schema.$hidden;

  return {
    ...subCommand,
    scope,
    hidden,
    impl,
  };
}

export async function parseJsonSchemaToSubCommandDescriptor(
  name: string,
  jsonPath: string,
  registry: SchemaRegistry,
  schema: JsonObject
): Promise<SubCommandDescriptor> {
  const options = await parseJsonSchemaToOptions(registry, schema);
  const aliases: string[] = [];
  if (isJsonArray(schema.$aliases)) {
    schema.$aliases.forEach((alias) => {
      if (typeof alias === 'string') {
        aliases.push(alias);
      }
    });
  }
  if (isJsonArray(schema.aliases)) {
    schema.aliases.forEach((alias) => {
      if (typeof alias === 'string') {
        aliases.push(alias);
      }
    });
  }
  if (typeof schema.alias === 'string') {
    aliases.push(schema.alias);
  }

  let longDescription = '';
  if (typeof schema.$longDescription === 'string' && schema.$longDescription) {
    const ldPath = resolve(dirname(jsonPath), schema.$longDescription);
    try {
      longDescription = readFileSync(ldPath, 'utf-8');
    } catch (e) {
      throw new CommandJsonPathException(ldPath, name);
    }
  }

  let usageNotes = '';
  if (typeof schema.$usageNotes === 'string' && schema.$usageNotes) {
    const unPath = resolve(dirname(jsonPath), schema.$usageNotes);
    try {
      usageNotes = readFileSync(unPath, 'utf-8');
    } catch (e) {
      throw new CommandJsonPathException(unPath, name);
    }
  }

  const description = '' + (schema.description === undefined ? '' : schema.description);

  return {
    name,
    description,
    ...(longDescription ? { longDescription } : {}),
    ...(usageNotes ? { usageNotes } : {}),
    options,
    aliases,
  };
}

export async function parseJsonSchemaToOptions(registry: SchemaRegistry, schema: JsonObject): Promise<Option[]> {
  const opts: Option[] = [];

  function jsonSchemaVisitor(current: JsonObject, pointer: JsonPointer, parentSchema?: JsonObject | JsonArray) {
    // ignore root
    if (!parentSchema) {
      return;
    }
    // ignore subitems (objects or arrays)
    if (pointer.split(/\/(?:properties|items|definitions)\//g).length > 2) {
      return;
    }
    if (isJsonArray(current)) {
      return;
    }

    if (pointer.indexOf('/not/') !== -1) {
      throw new Error(`The 'not' keyword is not supported in JSON schema.`);
    }

    const ptr = parseJsonPointer(pointer);
    const name = ptr[ptr.length - 1];

    // skip any non-property items
    if (ptr[ptr.length - 2] != 'properties') {
      return;
    }

    const typeSet = getTypesOfSchema(current);

    if (typeSet.size === 0) {
      throw new Error(`Cannot find type of schema.`);
    }

    const types = [...typeSet]
      .filter((x) => {
        switch (x) {
          case 'boolean':
          case 'number':
          case 'string':
            return true;
          case 'array':
            if (
              isJsonObject(current.items) &&
              typeof current.items.type === 'string' &&
              ['boolean', 'number', 'string'].includes(current.items.type)
            ) {
              return true;
            }
            return false;
          default:
            return false;
        }
      })
      .map((x) => getEnumFromValue(x, OptionType, OptionType.String));

    //
    if (types.length === 0) {
      // this means it is not usable on the command line (e.g. an Object)
      return;
    }

    const enumValues = ((isJsonArray(current.enum) && current.enum) || []).filter((x) => {
      switch (x) {
        case 'boolean':
        case 'number':
        case 'string':
          return true;
        default:
          return false;
      }
    }) as Value[];

    let defaultValue: string | number | boolean | undefined = undefined;

    if (current.default !== undefined) {
      switch (types[0]) {
        case 'string':
          if (typeof current.default === 'string') {
            defaultValue = current.default;
          }
          break;
        case 'number':
          if (typeof current.default === 'number') {
            defaultValue = current.default;
          }
          break;
        case 'boolean':
          if (typeof current.default === 'boolean') {
            defaultValue = current.default;
          }
          break;
      }
    }

    const type = types[0];
    const $default = current.$default;
    const $defaultIndex = isJsonObject($default) && $default['$source'] === 'argv' ? $default['index'] : undefined;

    const positional: number | undefined = typeof $defaultIndex === 'number' ? $defaultIndex : undefined;

    const required = isJsonArray(current.required) ? current.required.indexOf(name) !== -1 : false;

    const aliases = isJsonArray(current.aliases)
      ? [...current.aliases].map((x) => '' + x)
      : current.alias
      ? ['' + current.alias]
      : [];

    const format = typeof current.format === 'string' ? current.format : undefined;

    const visible = current.visible === undefined || current.visible === true;

    const hidden = !!current.hidden || !visible;

    // deprecated is set only if it is true or a string
    const xDeprecated = current['x-deprecated'];
    const deprecated = xDeprecated === true || typeof xDeprecated === 'string' ? xDeprecated : undefined;

    const xUserAnalytics = current['x-user-analytics'];
    const userAnalytics = typeof xUserAnalytics == 'number' ? xUserAnalytics : undefined;

    const option: Option = {
      name,
      description: '' + (current.description === undefined ? '' : current.description),
      ...(types.length == 1 ? { type } : { type, types }),
      ...(defaultValue !== undefined ? { default: defaultValue } : {}),
      ...(enumValues && enumValues.length > 0 ? { enum: enumValues } : {}),
      required,
      aliases,
      ...(format !== undefined ? { format } : {}),
      hidden,
      ...(userAnalytics ? { userAnalytics } : {}),
      ...(deprecated !== undefined ? { deprecated } : {}),
      ...(positional !== undefined ? { positional } : {}),
    };

    opts.push(option);
  }

  const flattenedSchema = await registry.flatten(schema).toPromise();
  visitJsonSchema(flattenedSchema, jsonSchemaVisitor);

  return opts.sort((a, b) => {
    if (a.positional) {
      if (b.positional) {
        return a.positional - b.positional;
      } else {
        return 1;
      }
    }
    if (b.positional) {
      return -1;
    }
    return 0;
  });
}

function getEnumFromValue<E, T extends E[keyof E]>(value: JsonValue, enumeration: E, defaultValue: T): T {
  if (typeof value !== 'string') {
    return defaultValue;
  }

  if (Object.values(enumeration).includes(value)) {
    return (value as unknown) as T;
  }

  return defaultValue;
}
