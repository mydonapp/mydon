export interface ExceptionMetadata {
  ignoreSentryLog?: boolean;
  [key: string]: unknown;
}

/**
 * Base class for custom exceptions.
 *
 * @abstract
 * @class ExceptionBase
 * @extends {Error}
 */
export abstract class ExceptionBase extends Error {
  abstract code: string;

  constructor(
    override readonly message: string,
    readonly cause?: Error,
    readonly metadata?: ExceptionMetadata
  ) {
    super(message);
  }
}

export abstract class BusinessError extends ExceptionBase {
  constructor(message: string, cause?: Error, metadata?: ExceptionMetadata) {
    super(message, cause, metadata);
  }
}
