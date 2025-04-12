import { BusinessError, ExceptionMetadata } from '../shared/errors/base.error';

export class WrongCredentialsError extends BusinessError {
  static readonly message = 'Wrong credentials';

  public readonly code = 'ACCOUNT.WRONG_CREDENTIALS';

  constructor(cause?: Error, metadata?: ExceptionMetadata) {
    super(WrongCredentialsError.message, cause, metadata);
  }
}
