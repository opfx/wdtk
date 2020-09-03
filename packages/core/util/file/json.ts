import * as FileSystem from 'fs';
import * as stripJsonComments from 'strip-json-comments';
import { writeToFile } from './file';
/**
 * This method is specifically for updating a JSON file using the filesystem
 *
 * @remarks
 * If you are looking to update a JSON file in a tree, look for ./ast-utils#updateJsonInTree
 * @param path Path of the JSON file on the filesystem
 * @param callback Manipulation of the JSON data
 */
export function updateJsonFile(path: string, callback: (a: any) => any) {
  const json = readJsonFile(path);
  callback(json);
  writeJsonFile(path, json);
}

export function serializeJson(json: any): string {
  return `${JSON.stringify(json, null, 2)}\n`;
}

/**
 * This method is specifically for reading a JSON file from the filesystem
 *
 * @remarks
 * If you are looking to read a JSON file in a Tree, use ./ast-utils#readJsonInTree
 * @param path Path of the JSON file on the filesystem
 */
export function readJsonFile<T = any>(path: string): T {
  return JSON.parse(stripJsonComments(FileSystem.readFileSync(path, 'utf-8')));
}

export function writeJsonFile(path: string, json: any) {
  writeToFile(path, serializeJson(json));
}
