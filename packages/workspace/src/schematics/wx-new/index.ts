import { chain } from '@angular-devkit/schematics';
import { Rule } from '@angular-devkit/schematics';

import { Schema as WxNewOptions } from './schema';

export default function (schema: WxNewOptions): Rule {
  console.error('running wx new schematic');
  return chain([]);
}
