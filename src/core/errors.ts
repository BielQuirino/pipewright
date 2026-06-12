export class PipewrightError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserError extends PipewrightError {
  readonly exitCode = 1;
}

export class InternalError extends PipewrightError {
  readonly exitCode = 2;
}
