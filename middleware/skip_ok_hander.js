const log = require('debug')('express-errorhandler:skip_ok_hander');

const DEFAULT_SKIP_PATHS = ['/favicon.ico', '/robots.txt'];
const ok200 = (err, req, res, next) => {
  res.status(200).end();
};

/**
 * In case of the specified pass, return simple 200 OK.
 *
 * @param {Array[String]} paths ex. ['/favicon.ico', '/robots.txt']
 * @param {*} fn res program code. ex. see ok200(...)
 */
module.exports = (paths = DEFAULT_SKIP_PATHS, fn = ok200) => {
  return (err, req, res, next) => {
    if (paths.includes(req.path)) {
      log('skip', req.path);
      return fn(err, req, res, next);
    }
    next(err);
  };
};
