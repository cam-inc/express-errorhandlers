const DEFAULT_ERROR_MESSAGE = 'Server Error';
const DEFAULT_ERROR_STATUS = 500;


class Handler {
  constructor(error, status = DEFAULT_ERROR_STATUS, message = DEFAULT_ERROR_MESSAGE, extra = {}, extraDebug = {}) {
    this.error = error || new Error();
    this.status = status;
    this.message = message;
    this.extra = extra;
    this.extraDebug = extraDebug;
  }

  toData() {
    return {
      status: this.status,
      message: this.message,
      extra: this.extra,
      ///
      stack: String(this.error.stack),
      extraDebug: this.extraDebug,
    };

  }
}

module.exports = Handler;
