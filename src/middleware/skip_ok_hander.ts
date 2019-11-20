import debug from 'debug';
import { NextFunction, Request, Response } from 'express';
const log = debug('express-errorhandler:skip_ok_hander');

const DEFAULT_SKIP_PATHS = ['/favicon.ico', '/robots.txt'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ok200 = (_err: Error, _req: Request, res: Response, _next?: NextFunction) => {
  res.status(200).end();
};

/**
 * In case of the specified pass, return simple 200 OK.
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
