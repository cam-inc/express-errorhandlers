const DEFAULT_ERROR_MESSAGE = 'Server Error';
const DEFAULT_ERROR_STATUS = 500;

/**
 * Error Handler Class
 */
export default class Handler extends Error {
  public status: number;
  public extra: any;
  public extraDebug: any;

  constructor(error?: Error, status?: number, message?: string, extra?: {}, extraDebug?: {}) {
    super(message || error?.message || DEFAULT_ERROR_MESSAGE);

    this.name = message || error?.message || DEFAULT_ERROR_MESSAGE;
    this.status = status || DEFAULT_ERROR_STATUS;
    this.extra = extra || {};
    this.extraDebug = extraDebug || {};

    if (error?.stack) {
      this.stack = error.stack;
    }
  }

  /**
   * Get output data
   */
  public toData() {
    return {
      extra: this.extra,
      extraDebug: this.extraDebug,
      message: this.message,
      stack: this.stack,
      status: this.status,
    };
  }
}
