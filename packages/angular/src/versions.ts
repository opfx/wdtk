import { versions as coreVersions } from '@wdtk/core';
// see: for Karma dependencies https://github.com/nrwl/nx/blob/master/packages/angular/src/schematics/karma/karma.ts
export const versions = {
  ...coreVersions,
  Karma: '~5.0.0',
  KarmaChromeLauncher: '~3.1.0',
  KarmaCoverageIstanbulReporter: '~3.0.2',
  KarmaJasmine: '~4.0.0',
  KarmaJasmineHtmlReporter: '^1.5.0',
  NgPackager: '^11.0.0',
  Protractor: '~7.0.0',
  JasmineCore: '~3.6.0',
  JasmineSpecReporter: '~5.0.0',
  JasmineTypes: '~3.5.0',
  JasmineWd2Types: '~2.0.3',
};
