## Upgrading angular libraries

### Upgrading angular version

The following `angular` libraries are being used by `wdtk` packages :

|     | Dependency                    | Semver Modifier | Consumer                                      |     |
| --- | :---------------------------- | :-------------- | :-------------------------------------------- | :-- |
| 1   | @angular/cli                  | ^               | cli                                           |     |
| 2   | @angular-devkit/architect     | ~               | core, cypress, jest, node                     |
| 3   | @angular-devkit/build-webpack | ^               | node                                          |
| 4   | @angular-devkit/core          | ^               | core, workspace                               |
| 5   | @angular-devkit/schematics    | ^               | angular, core, cypress, jest, node, workspace |
| 6   | @schematics/angular           | ^               | angular                                       |

To upgrade an angular library run in the workspace root

```
yarn up <package>@<semver-modifier><version>
```

Every time the angular version is upgraded, the version constants that provide angular related version information for the `wdtk` schematics, might also need to be updated.

The following constant version need to be updated:

|     | Version      | Package | File      |     |
| --- | :----------- | :------ | :-------- | :-- |
| 1   | Angular      | core    | constants |     |
| 2   | AngularBuild | core    | constants |     |
| 3   | NodeTypes    | core    | constants |     |
| 4   | TsLib        | core    | constants |     |
| 5   | TsNode       | core    | constants |     |
| 6   | Typescript   | core    | constants |     |
| 7   | Rxjs         | core    | constants |     |
| 8   | ZoneJs       | core    | constants |     |

To find the versions for `RxJs`, `ZoneJs`, `CodeLyzer`, `NodeTypes`, `TsLib`, `TsLint`, `TsNode` and `Typescript`, install `@angular/cli`, with the version you are upgrading to, and use it to create a new application. Open generated `package.json`, and check the versions used by the vanilla schematics. If the versions in the generated `package.json` are higher than the ones defined in the version constants, update the constants to the newer version.
