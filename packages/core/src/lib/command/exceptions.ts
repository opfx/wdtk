import { CoreException } from './../exceptions';
export class CommandJsonPathException extends CoreException {
  constructor(public readonly path: string, public readonly name: string) {
    super(`File ${path} was not found while constructing the subCommand ${name}.`);
  }
}

export class CommandNotFoundException extends CoreException {
  constructor(public readonly commandName: string) {
    super(`Failed to find '${commandName}'command.`);
  }
}

export class UnknownCollectionException extends CoreException {
  constructor(collectionName: string) {
    super(`Invalid collection '${collectionName}'.`);
  }
}
