import { CreateFileAction, noop, OverwriteFileAction, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
let prettier;
try {
  prettier = require('prettier');
} catch (e) {}
import { from } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import * as Path from 'path';

export function formatFiles(options: { skipFormat?: boolean } = { skipFormat: false }): Rule {
  if (options.skipFormat || !prettier || !process.env.WX_WORKSPACE_ROOT) {
    return noop();
  }
  return (host: Tree, ctx: SchematicContext) => {
    const files = new Set(
      host.actions
        .filter((action) => action.kind !== 'd' && action.kind !== 'r')
        .map((action: OverwriteFileAction | CreateFileAction) => ({
          path: action.path,
          content: action.content.toString(),
        }))
    );
    if (files.size === 0) {
      return host;
    }
    return from(files).pipe(
      filter((file) => host.exists(file.path)),
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
          host.overwrite(file.path, prettier.format(file.content, options));
        } catch (e) {
          ctx.logger.warn(`Could not format ${file.path} because ${e.message}`);
        }
      }),
      map(() => host)
    );
  };
}