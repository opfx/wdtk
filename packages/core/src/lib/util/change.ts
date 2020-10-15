import { Tree } from '@angular-devkit/schematics';

import { findNodes } from './../typescript';

export interface Change {
  apply(host: any): Promise<void>;

  readonly type: string;
  readonly path: string | null;
  readonly order: number;
  readonly description: string;
}

export class NoopChange implements Change {
  type = 'noop';
  description = 'No operation.';
  order = Infinity;
  path = null;

  apply() {
    return Promise.resolve();
  }
}

export class InsertChange implements Change {
  type = 'insert';
  order: number;
  description: string;

  constructor(public path: string, public pos: number, public toAdd: string) {
    if (pos < 0) {
      throw new Error('Negative positions are invalid');
    }
    this.description = `Inserted ${toAdd} into position ${pos} of ${path}`;
    this.order = pos;
  }

  apply(host: any) {
    return host.read(this.path).then((content) => {
      const prefix = content.substring(0, this.pos);
      const suffix = content.substring(this.pos);

      return host.write(this.path, `${prefix}${this.toAdd}${suffix}`);
    });
  }
}

export class RemoveChange implements Change {
  type = 'remove';
  order: number;
  description: string;

  constructor(public path: string, public pos: number, public toRemove: string) {
    if (pos < 0) {
      throw new Error('Negative positions are invalid');
    }
    this.description = `Removed ${toRemove} into position ${pos} of ${path}`;
    this.order = pos;
  }

  apply(host: any): Promise<void> {
    return host.read(this.path).then((content) => {
      const prefix = content.substring(0, this.pos);
      const suffix = content.substring(this.pos + this.toRemove.length);
      return host.write(this.path, `${prefix}${suffix}`);
    });
  }
}

export class ReplaceChange implements Change {
  type = 'replace';
  order: number;
  description: string;

  constructor(public path: string, public pos: number, public oldText: string, public newText: string) {
    if (pos < 0) {
      throw new Error('Negative positions are invalid');
    }
    this.description = `Replaced ${oldText} into position ${pos} of ${path} with ${newText}`;
    this.order = pos;
  }

  apply(host: any): Promise<void> {
    return host.read(this.path).then((content) => {
      const prefix = content.substring(0, this.pos);
      const suffix = content.substring(this.pos + this.oldText.length);
      const text = content.substring(this.pos, this.pos + this.oldText.length);
      if (text !== this.oldText) {
        return Promise.reject(new Error(`Invalid replace: "${text}" != "${this.oldText}".`));
      }
      return host.write(this.path, `${prefix}${this.newText}${suffix}`);
    });
  }
}

export function insert(host: Tree, modulePath: string, changes: Change[]) {
  if (changes.length < 1) {
    return;
  }

  // sort changes so that the highest pos goes first
  const orderedChanges = changes.sort((a, b) => b.order - a.order);

  const recorder = host.beginUpdate(modulePath);
  for (const change of orderedChanges) {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    } else if (change instanceof RemoveChange) {
      recorder.remove(change.pos - 1, change.toRemove.length + 1);
    } else if (change instanceof ReplaceChange) {
      recorder.remove(change.pos, change.oldText.length);
      recorder.insertLeft(change.pos, change.newText);
    } else if (change.type === 'noop') {
      // do nothing
    } else {
      throw new Error(`Unexpected Change '${change.constructor.name}'`);
    }
  }
  host.commitUpdate(recorder);
}
