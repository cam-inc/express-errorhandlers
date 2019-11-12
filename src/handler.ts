const DEFAULT_ERROR_MESSAGE = 'Server Error';
const DEFAULT_ERROR_STATUS = 500;

/**
 * Error Handler Class
 */
export default class Handler {
  public error: Error;
  public status: number;
  public message: string;
  public extra: any;
  public extraDebug: any;

  constructor(error?: Error, status?: number, message?: string, extra?: {}, extraDebug?: {}) {
    this.error = error || new Error();
    this.status = status || DEFAULT_ERROR_STATUS;
    this.message = message || DEFAULT_ERROR_MESSAGE;
    this.extra = extra || {};
    this.extraDebug = extraDebug || {};
  }

  /**
   * Get output data
   */
  public toData() {
    return {
      extra: this.extra,
      extraDebug: this.extraDebug,
      message: this.message,
      stack: String(this.error.stack),
      status: this.status,
    };
  }
}
