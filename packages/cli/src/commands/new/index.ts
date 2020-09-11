/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { normalize } from '@angular-devkit/core';
import { Arguments, SchematicCommand } from '@wdtk/core';
import { WorkspaceTask } from '@wdtk/workspace';

import { Schema as NewCommandSchema } from './schema';

export class NewCommand extends SchematicCommand<NewCommandSchema> {
  public readonly allowMissingWorkspace = true;
  schematicName = 'ng-new';

  async initialize(options: NewCommandSchema & Arguments): Promise<void> {
    this.collectionName = options.collection || (await this.getDefaultSchematicCollection());
    await super.initialize(options);
  }

  async run(options: NewCommandSchema & Arguments): Promise<number | void> {
    const rootDirectory = normalize(this.workspace.root);
    const engineHost = this.getEngineHost();
    engineHost.registerTaskExecutor(WorkspaceTask.GitFlowInit, { rootDirectory });
    engineHost.registerTaskExecutor(WorkspaceTask.YarnInit, { rootDirectory });
    return this.runSchematic({
      collectionName: this.collectionName,
      schematicName: this.schematicName,
      schematicOptions: options['--'] || [],
      debug: !!options.verbose,
      dryRun: !!options.dryRun,
      force: !!options.force,
    });
  }
}
