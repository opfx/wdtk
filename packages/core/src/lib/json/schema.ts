import { schema } from '@angular-devkit/core';

export type JsonPointer = schema.JsonPointer;
export type UriHandler = schema.UriHandler;
export class CoreSchemaRegistry extends schema.CoreSchemaRegistry {}
export interface SchemaRegistry extends schema.SchemaRegistry {}
export class SchemaValidationException extends schema.SchemaValidationException {}

export const visitJsonSchema = schema.visitJsonSchema;
export const parseJsonPointer = schema.parseJsonPointer;
export const getTypesOfSchema = schema.getTypesOfSchema;
export const transforms = schema.transforms;
export interface PromptDefinition extends schema.PromptDefinition {}
export type PromptProvider = schema.PromptProvider;
export type SchemaValidatorError = schema.SchemaValidatorError;
