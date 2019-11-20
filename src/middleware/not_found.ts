import debug from 'debug';
const log = debug('express-errorhandler:not_found');
import { NextFunction, Request, Response } from 'express';
import Handler from '../handler';
const DEFAULT_MESSAGE = 'Not Found';

/**
 * catch 404 and forward to error handler
 */
export default (message = DEFAULT_MESSAGE, extra = {}, extraDebug = {}) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    const handler = new Handler(undefined, 404, message, extra, extraDebug);
    log('not found %O', handler.toData());
    next(handler);
  };
};
