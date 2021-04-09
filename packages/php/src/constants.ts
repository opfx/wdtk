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

export const launchConfigurations = [
  {
    wdtkLaunchId: 'phpListenForXDebug',
    name: 'Listen for Xdebug',
    type: 'php',
    request: 'launch',
    port: 9000,
  },
  {
    wdtkLaunchId: 'phpLaunchCurrentScript',
    name: 'Launch PHP with currently open script',
    type: 'php',
    request: 'launch',
    program: '${file}',
    cwd: '${fileDirname}',
    port: 9000,
    runtimeArgs: ['-dxdebug.mode=debug', '-dxdebug.start_with_request=yes', '-dxdebug.client_port=9000'],
  },
];
