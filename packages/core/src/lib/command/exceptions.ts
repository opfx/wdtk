import { CoreException } from './../exceptions';
export class CommandJsonPathException extends CoreException {
  constructor(public readonly path: string, public readonly name: string) {
    super(`File ${path} was not found while constructing the subcommand ${name}.`);
  }
}
