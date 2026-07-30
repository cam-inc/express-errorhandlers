const DEFAULT_ERROR_MESSAGE = 'Server Error';
const DEFAULT_ERROR_STATUS = 500;

/**
 * Upstream middleware (e.g. basic-auth-connect) only attaches status/statusCode to a
 * plain Error before calling next(), so without honoring it every 4xx would collapse to 500.
 * The check mirrors Express's default error response: Express depends on finalhandler and
 * routes unhandled requests (including next(err)) through it, and finalhandler accepts a
 * status only when it is numeric and within 400-599.
 * refs:
 *   - Express uses finalhandler as its default handler:
 *     https://github.com/expressjs/express/blob/v5.2.1/lib/application.js#L154
 *   - finalhandler status resolution (getErrorStatusCode):
 *     https://github.com/pillarjs/finalhandler/blob/v2.1.1/index.js#L192
 */
function getErrorStatusCode(error?: Error): number | undefined {
  const err = error as { status?: number; statusCode?: number } | undefined;
  if (typeof err?.status === 'number' && err.status >= 400 && err.status < 600) {
    return err.status;
  }
  if (typeof err?.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) {
    return err.statusCode;
  }
  return undefined;
}

/**
 * Error Handler Class
 */
export default class Handler extends Error {
  public status: number;
  public extra: any;
  public extraDebug: any;
  public code?: string;

  constructor(error?: Error, status?: number, message?: string, extra?: {}, extraDebug?: {}) {
    super(message || error?.message || DEFAULT_ERROR_MESSAGE);

    this.name = message || error?.message || DEFAULT_ERROR_MESSAGE;
    this.status = status || getErrorStatusCode(error) || DEFAULT_ERROR_STATUS;
    this.extra = extra || {};
    this.extraDebug = extraDebug || {};
    this.code = (error as { code?: string } | undefined)?.code;

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
