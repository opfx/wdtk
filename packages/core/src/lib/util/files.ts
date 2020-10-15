import { CreateFileAction, FileEntry, OverwriteFileAction, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { forEach, noop } from '@angular-devkit/schematics';

let prettier;

import { from } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import * as Path from 'path';

export function formatFiles(options: { skipFormat?: boolean } = { skipFormat: false }): Rule {
  if (!prettier) {
    try {
      prettier = require('prettier');
    } catch {}
  }
  if (options.skipFormat || !prettier || !process.env.WX_WORKSPACE_ROOT) {
    return noop();
  }
  return (tree: Tree, ctx: SchematicContext) => {
    const files = new Set(
      tree.actions
        .filter((action) => action.kind !== 'd' && action.kind !== 'r')
        .map((action: OverwriteFileAction | CreateFileAction) => ({
          path: action.path,
          content: action.content.toString(),
        }))
    );
    if (files.size === 0) {
      return tree;
    }
    return from(files).pipe(
      filter((file) => tree.exists(file.path)),
      mergeMap(async (file) => {
        const systemPath = Path.join(process.env.WX_WORKSPACE_ROOT, file.path);

        let options: any = {
          filepath: systemPath,
        };
        const resolvedOptions = await prettier.resolveConfig(systemPath);
        if (resolvedOptions) {
          options = {
            ...options,
            ...resolvedOptions,
          };
        }
        const support = await prettier.getFileInfo(systemPath, options);
        if (support.ignored || !support.inferredParser) {
          return;
        }

        try {
          tree.overwrite(file.path, prettier.format(file.content, options));
        } catch (e) {
          ctx.logger.warn(`Could not format ${file.path} because ${e.message}`);
        }
      }),
      map(() => tree)
    );
  };
}

/**
 * Remove the specified file from the Virtual Schematic Tree
 * @param path
 */
export function deleteFile(path: string): Rule {
  return forEach((entry: FileEntry): FileEntry | null => {
    return entry.path === path ? null : entry;
  });
}
