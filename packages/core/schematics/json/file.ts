import { JsonValue } from '@wdtk/core';
import { Tree } from '@angular-devkit/schematics';

import { Node, applyEdits, findNodeAtLocation, getNodeValue, modify, parseTree } from 'jsonc-parser';

export type InsertionIndex = (properties: string[]) => number;
export type JsonPath = (string | number)[];

export class JsonFile {
  content: string;
  error: undefined | Error;

  constructor(private readonly host: Tree, private readonly path: string) {
    const buffer = this.host.read(this.path);
    if (buffer) {
      this.content = buffer.toString();
    } else {
      this.error = new Error(`Could not read ${path}.`);
    }
  }

  private _jsonAst: Node | undefined;
  private get JsonAst(): Node {
    if (this._jsonAst) {
      return this._jsonAst;
    }

    this._jsonAst = parseTree(this.content);

    return this._jsonAst;
  }

  get(jsonPath: JsonPath): unknown {
    if (jsonPath.length === 0) {
      return getNodeValue(this.JsonAst);
    }

    const node = findNodeAtLocation(this.JsonAst, jsonPath);

    return node === undefined ? undefined : getNodeValue(node);
  }

  modify(jsonPath: JsonPath, value: JsonValue | undefined, insertInOrder?: InsertionIndex | false): void {
    let getInsertionIndex: InsertionIndex | undefined;
    if (insertInOrder === undefined) {
      const property = jsonPath.slice(-1)[0];
      getInsertionIndex = (properties) => [...properties, property].sort().findIndex((p) => p === property);
    } else if (insertInOrder !== false) {
      getInsertionIndex = insertInOrder;
    }

    const edits = modify(this.content, jsonPath, value, {
      getInsertionIndex,
      formattingOptions: {
        insertSpaces: true,
        tabSize: 2,
      },
    });

    this.content = applyEdits(this.content, edits);
    this.host.overwrite(this.path, this.content);
    this._jsonAst = undefined;
  }

  remove(jsonPath: JsonPath): void {
    if (this.get(jsonPath) !== undefined) {
      this.modify(jsonPath, undefined);
    }
  }
}
