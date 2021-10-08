# Upgrade angular versions

## Update runtime dependencies

1. Install globally the **@angular/cli** with the version to upgrade to
1. Create a new project using

```bash
$ ng new
```

3. Navigate to the newly created workspace, and open the _package.json_ in **node_modules/@angular/cli** directory
1. Write down the versions for the following packages

   1. @angular-devkit/architect
   1. @angular-devkit/core
   1. @angular-devkit/schematics
   1. @schematics/angular
   1. @angular-devkit/build-webpack (can be found in the ng-update.packageGroup)
   1. ng-packagr

1. Once all version of all these packages are collected, upgrade the versions in the workspace by running the following commands

```
$ yarn up @angular/cli@^13.0.0-next.6
$ yarn up @angular-devkit/architect@~0.1300.0-next.6
$ yarn up @angular-devkit/build-webpack@^0.1300.0-next.6
$ yarn up @angular-devkit/core@^13.0.0-next.6
$ yarn up @angular-devkit/schematics@^13.0.0-next.6
$ yarn up @schematics/angular@^13.0.0-next.6
```

6. Run the following commands and make sure there are no mixed version for the same package

```
$ yarn why @angular/cli@^13.0.0-next.6
$ yarn why @angular-devkit/architect@~0.1300.0-next.6
$ yarn why @angular-devkit/build-webpack@^0.1300.0-next.6
$ yarn why @angular-devkit/core@^13.0.0-next.6
$ yarn why @angular-devkit/schematics@^13.0.0-next.6
$ yarn why @schematics/angular@^13.0.0-next.6
```

7. Most likely the **typescript** and **rxjs** will need to be updated as well. Their version can be found from the _package.json_ in template workspace.
1.
1.
1.
1.
1.
1. bogdan@mac wdtk $ yarn
➤ YN0000: ┌ Resolution step
➤ YN0060: │ @wdtk/node@workspace:packages/node provides webpack (p98851) with version 4.46.0, which doesn't satisfy what @angular-devkit/build-webpack requests
➤ YN0060: │ @wdtk/node@workspace:packages/node provides webpack-dev-server (pd4681) with version 3.11.2, which doesn't satisfy what @angular-devkit/build-webpack requests
➤ YN0060: │ @wdtk/node@workspace:packages/node [6b6f9] provides webpack (p45a9e) with version 4.46.0, which doesn't satisfy what @angular-devkit/build-webpack requests
➤ YN0060: │ @wdtk/node@workspace:packages/node [6b6f9] provides webpack-dev-server (p5e2d7) with version 3.11.2, which doesn't satisfy what @angular-devkit/build-webpack requests
➤ YN0000: │ Some peer dependencies are incorrectly met; run yarn explain peer-requirements <hash> for details, where <hash> is the six-letter p-prefixed code
➤ YN0000: └ Completed in 35s 153ms
➤ YN0000: ┌ Fetch step
➤ YN0013: │ typescript@npm:4.3.5 can't be found in the cache and will be fetched from the remote registry
➤ YN0013: │ typescript@patch:typescript@npm%3A4.3.5#builtin<compat/typescript>::version=4.3.5&hash=cc6730 can't be found in the cache and will be fetched from the disk
➤ YN0013: │ typescript@npm:4.3.5 can't be found in the cache and will be fetched from the remote registry
➤ YN0066: │ typescript@patch:typescript@npm%3A4.3.5#builtin<compat/typescript>::version=4.3.5&hash=cc6730: Cannot apply hunk #2 (set enableInlineHunks for details)
➤ YN0000: └ Completed in 1s 30ms
➤ YN0000: Failed with errors in 36s 188ms
bogdan@mac wdtk $ yarn
   ➤ YN0000: ┌ Resolution step
   ➤ YN0061: │ debug@npm:4.1.1 is deprecated: Debug versions >=3.2.0 <3.2.7 || >=4 <4.3.1 have a low-severity ReDos regression when used in a Node.js environment. It is recommended you upgrade to 3.2.7 or 4.3.1. (https://github.com/visionmedia/debug/issues/797)
   ➤ YN0061: │ chokidar@npm:2.1.8 is deprecated: Chokidar 2 will break on node v14+. Upgrade to chokidar 3 with 15x less dependencies.
   ➤ YN0061: │ querystring@npm:0.2.0 is deprecated: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.
   ➤ YN0032: │ fsevents@npm:2.3.2: Implicit dependencies on node-gyp are discouraged
   ➤ YN0061: │ fsevents@npm:1.2.13 is deprecated: fsevents 1 will break on node v14+ and could be using insecure binaries. Upgrade to fsevents 2.
   ➤ YN0032: │ fsevents@npm:2.3.2: Implicit dependencies on node-gyp are discouraged
   ➤ YN0061: │ fsevents@npm:1.2.13 is deprecated: fsevents 1 will break on node v14+ and could be using insecure binaries. Upgrade to fsevents 2.
   ➤ YN0032: │ nan@npm:2.15.0: Implicit dependencies on node-gyp are discouraged
   ➤ YN0061: │ har-validator@npm:5.1.5 is deprecated: this library is no longer supported
   ➤ YN0061: │ urix@npm:0.1.0 is deprecated: Please see https://github.com/lydell/urix#deprecated
   ➤ YN0061: │ request@npm:2.88.2 is deprecated: request has been deprecated, see https://github.com/request/request/issues/3142
   ➤ YN0061: │ uuid@npm:3.4.0 is deprecated: Please upgrade to version 7 or higher. Older versions may use Math.random() in certain circumstances, which is known to be problematic. See https://v8.dev/blog/math-random for details.
   ➤ YN0061: │ resolve-url@npm:0.2.1 is deprecated: https://github.com/lydell/resolve-url#deprecated
   ➤ YN0061: │ object-keys@npm:0.4.0 is deprecated:
   ➤ YN0032: │ evp_bytestokey@npm:1.0.3: Implicit dependencies on node-gyp are discouraged
   ➤ YN0060: │ @wdtk/node@workspace:packages/node provides webpack (p98851) with version 4.46.0, which doesn't satisfy what @angular-devkit/build-webpack requests
   ➤ YN0060: │ @wdtk/node@workspace:packages/node provides webpack-dev-server (pd4681) with version 3.11.2, which doesn't satisfy what @angular-devkit/build-webpack requests
   ➤ YN0060: │ @wdtk/node@workspace:packages/node [6b6f9] provides webpack (p45a9e) with version 4.46.0, which doesn't satisfy what @angular-devkit/build-webpack requests
   ➤ YN0060: │ @wdtk/node@workspace:packages/node [6b6f9] provides webpack-dev-server (p5e2d7) with version 3.11.2, which doesn't satisfy what @angular-devkit/build-webpack requests
   ➤ YN0000: │ Some peer dependencies are incorrectly met; run yarn explain peer-requirements <hash> for details, where <hash> is the six-letter p-prefixed code
