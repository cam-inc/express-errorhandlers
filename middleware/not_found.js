
const log = require('debug')('express-errorhandler:not_found');
const Handler = require('../handler');
const DEFAULT_MESSAGE = 'Not Found';

// catch 404 and forward to error handler
module.exports = (message = DEFAULT_MESSAGE, extra, extraDebug) => {
  return (req, res, next) => {
    const handler = new Handler(null, 404, message, extra, extraDebug);
    log('not found %O', handler.toData());
    next(handler);
  };
};
