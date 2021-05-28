import accepts from 'accepts';
import _debug from 'debug';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import pug, { compileTemplate } from 'pug';
const log = _debug('express-errorhandler:error_handler');

import Handler from '../handler';

// const TYPE_TEXT = 'text';
const TYPE_JSON = 'json';
const TYPE_HTML = 'html';
const SUPPORT_TYPES = [TYPE_JSON, TYPE_HTML];

export interface Options {
  debug?: boolean;
  templateHTML?: string;
  templateHTMLOptions?: pug.Options;
  templateTEXT?: string;
  templateTEXTOptions?: pug.Options;
  status?: number;
  message?: string;
  extra?: {};
  extraDebug?: {};
  final?: (req: Request, res: Response, handler: Handler) => void;
}

/**
 * Multi Error Handler
 */
export default (options: Options = {}) => {
  log('options=%O', options);

  const debug = !!options.debug;
  const templateHTML = options.templateHTML || path.join(__dirname, '../views/html/layout.pug');
  const templateHTMLOptions = options.templateHTMLOptions;
  const templateTEXT = options.templateTEXT || path.join(__dirname, '../views/text/layout.pug');
  const templateTEXTOptions = options.templateTEXTOptions;

  let compileHTML: compileTemplate;
  let compileText: compileTemplate;

  try {
    fs.statSync(templateHTML);
    fs.statSync(templateTEXT);

    compileHTML = pug.compileFile(templateHTML, templateHTMLOptions);
    compileText = pug.compileFile(templateTEXT, templateTEXTOptions);
  } catch (e) {
    compileHTML = pug.compile(templateHTML, templateHTMLOptions);
    compileText = pug.compile(templateTEXT, templateTEXTOptions);
  }

  const status = options.status;
  const message = options.message;
  const extra = options.extra;
  const extraDebug = options.extraDebug;

  const final = options.final;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: Error | Handler, req: Request, res: Response, _next: NextFunction) => {
    let handler: Handler;

    if (!(err instanceof Handler)) {
      handler = new Handler(err, status, message, extra, extraDebug);
    } else {
      handler = err;
    }

    const data = handler.toData();
    const accept = accepts(req);

    switch (accept.type(SUPPORT_TYPES)) {
      case TYPE_JSON: {
        const ret = {
          request: {},
          response: {
            extra: data.extra,
            extraDebug: {},
            message: data.message,
            stack: '',
            status: data.status,
          },
        };
        if (debug) {
          ret.request = {
            accessurl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
            headers: req.headers,
            hostname: req.hostname,
            httpVersion: req.httpVersion,
            ip: req.ip,
            ips: req.ips,
            method: req.method,
            originalUrl: req.originalUrl,
            params: req.params,
            path: req.path,
            protocol: req.protocol,
            query: req.query,
            url: req.url,
          };
          ret.response.stack = data.stack;
          ret.response.extraDebug = data.extraDebug;
        }

        res.status(handler.status).json(ret);
        break;
      }
      case TYPE_HTML: {
        const html = compileHTML({
          data,
          debug,
          req,
          res,
        });

        res
          .status(data.status)
          .set('Content-Type', 'text/html')
          .write(html);
        break;
      }
      default: {
        const text = compileText({
          data,
          debug,
          req,
          res,
        });
        res
          .status(data.status)
          .set('Content-Type', 'text/plain')
          .write(text);
        break;
      }
    }

    log('%O', {
      request: {
        accessurl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        headers: req.headers,
        hostname: req.hostname,
        httpVersion: req.httpVersion,
        ip: req.ip,
        ips: req.ips,
        method: req.method,
        originalUrl: req.originalUrl,
        params: req.params,
        path: req.path,
        protocol: req.protocol,
        query: req.query,
        url: req.url,
      },
      response: data,
    });

    ///
    res.end();

    if (final) {
      final(req, res, handler);
    }
  };
};
