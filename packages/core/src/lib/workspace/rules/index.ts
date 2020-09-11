import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { addPackageJsonDependency } from './../../package';
import { NodeDependency } from './../../package';

export function addWorkspaceDependency(dependency: NodeDependency): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`adding workspace '${dependency.type}' dependency '${dependency.name}@${dependency.version}'`);
    addPackageJsonDependency(host, dependency);
  };
}

export function addWorkspaceDependencies(dependencies: NodeDependency[]): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    dependencies.forEach((dependency) => {
      ctx.logger.debug(`adding workspace '${dependency.type}' dependency '${dependency.name}@${dependency.version}'`);
      addPackageJsonDependency(host, dependency);
    });
  };
}
