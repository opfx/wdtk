import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, move, schematic } from '@angular-devkit/schematics';

import { Schema as LibraryOptions } from './schema';

export default function (libraryOptions: LibraryOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {};
}
