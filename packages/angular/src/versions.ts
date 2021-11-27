import { versions as coreVersions } from '@wdtk/core';
// see: for Karma dependencies https://github.com/nrwl/nx/blob/master/packages/angular/src/schematics/karma/karma.ts
export const versions = {
  ...coreVersions,
  Karma: '~6.3.0',
  KarmaChromeLauncher: '~3.1.0',
  KarmaCoverage: '~3.0.2',
  KarmaJasmine: '~4.0.0',
  KarmaJasmineHtmlReporter: '~1.7.0',
  NgPackager: '^13.0.0',
  Protractor: '~7.0.0',
  JasmineCore: '~3.10.0',
  JasmineTypes: '~3.10.0',
};
