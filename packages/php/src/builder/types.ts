export interface BuilderConfig {
  alias?: string;
  main: string;
  package: boolean;
  progress: boolean;
  projectName: string;
  projectRoot: string;
  projectType: string;
  sourceRoot: string;
  outputPath?: string;
}

export enum ErrorSeverity {
  Warning,
  Error,
}

export interface BuildError {
  severity: ErrorSeverity;
  file?: string;
  line?: string;
  message: string;
}

export interface BuildResults {
  errors?: BuildError[];
  warnings?: BuildError[];
}
