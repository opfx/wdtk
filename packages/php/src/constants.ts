import { versions as latestVersions } from '@wdtk/core';

export const versions = {
  ...latestVersions,
  Php: '7.4', // used to configure prettier in the init schematic
  PhpUnit: '^9.0.0',
  Paratest: '^6.2.0',
  PrettierPluginPhp: '^0.16.2',
};

// list of essentials dudemelo.php-essentials

// phpcs for vscode :valeryanm.vscode-phpsab
// ikappas.phpcs

export const extensionsRecommendations = ['felixfbecker.php-debug', 'bmewburn.vscode-intelephense-client', 'recca0120.vscode-phpunit'];
