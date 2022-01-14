# Upgrade angular versions

## Update package dependencies

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
1. It is also like that **webpack** and **webpack-dev-server** will need to be updated. The required version is found in _package.json_ of **@angular-devkit/build-webpack**

```
$ yarn up webpack@^5.30.0
$ yarn up webpack-dev-server@^4.0.0
```

## Update runtime dependencies

Every time the angular version is upgraded, the version constants that provide angular related version information for the `wdtk` schematics, might also need to be updated.
The following constant version need to be updated:

|     | Version                  | Package | File      |     |
| --- | :----------------------- | :------ | :-------- | :-- |
| 1   | Angular                  | core    | constants |     |
| 2   | AngularBuild             | core    | constants |     |
| 3   | NodeTypes                | core    | constants |     |
| 4   | TsLib                    | core    | constants |     |
| 5   | TsNode                   | core    | constants |     |
| 6   | Typescript               | core    | constants |     |
| 7   | Rxjs                     | core    | constants |     |
| 8   | ZoneJs                   | core    | constants |     |
| 9   | Karma                    | angular | constants |     |
| 10  | KarmaChromeLauncher      | angular | constants |     |
| 11  | KarmaCoverage            | angular | constants |     |
| 12  | KarmaJasmine             | angular | constants |     |
| 13  | KarmaJasmineHtmlReporter | angular | constants |     |
| 14  | JasmineCore              | angular | constants |     |
| 15  | JasmineTypes             | angular | constants |     |
| 16  | NgPackager               | angular | constants |     |
