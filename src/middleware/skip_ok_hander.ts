import debug from 'debug';
import { NextFunction, Request, Response } from 'express';
const log = debug('express-errorhandler:skip_ok_hander');

const DEFAULT_SKIP_PATHS = ['/favicon.ico', '/robots.txt'];
// tslint:disable-next-line: variable-name
const ok200 = (_err: Error, _req: Request, res: Response, _next?: NextFunction) => {
  res.status(200).end();
};

/**
 * In case of the specified pass, return simple 200 OK.
 *
 * @param {Array[String]} paths ex. ['/favicon.ico', '/robots.txt']
 * @param {*} fn res program code. ex. see ok200(...)
 */
export default (paths = DEFAULT_SKIP_PATHS, fn = ok200) => {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (paths.includes(req.path)) {
      log('skip', req.path);
      return fn(err, req, res, next);
    }
    next(err);
  };
};
