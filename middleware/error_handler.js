const path = require('path');
const fs = require('fs');

const accepts = require('accepts');
const pug = require('pug');
const log = require('debug')('express-errorhandler:error_handler');

const Handler = require('../handler');

//const TYPE_TEXT = 'text';
const TYPE_JSON = 'json';
const TYPE_HTML = 'html';
const SUPPORT_TYPES = [TYPE_JSON, TYPE_HTML];


module.exports = options => {
  log('options=%O', options);

  const debug = !!options.debug;
  const templateHTML = options.templateHTML || path.join(__dirname, '../views/html/layout.pug');
  const templateHTMLOptions = options.templateHTMLOptions;
  const templateTEXT = options.templateTEXT || path.join(__dirname, '../views/text/layout.pug');
  const templateTEXTOptions = options.templateTEXTOptions;

  let compileHTML;
  let compileText;

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


  return (err, req, res, next) => { // eslint-disable-line

    let handler = err;

    if (!(err instanceof Handler)) {
      handler = new Handler(err, status, message, extra, extraDebug);
    }

    const data = handler.toData();
    const accept = accepts(req);

    switch (accept.type(SUPPORT_TYPES)) {
      case TYPE_JSON:
        const ret = {
          response: {
            status: data.status,
            message: data.message,
            extra: data.extra,
          }
        };
        if (debug) {
          ret.request = {
            accessurl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
            headers: req.headers,
            hostname: req.hostname,
            ip: req.ip,
            ips: req.ips,
            originalUrl: req.originalUrl,
            url: req.url,
            path: req.path,
            httpVersion: req.httpVersion,
            method: req.method,
            protocol: req.protocol,
            params: req.params,
            query: req.query
          };
          ret.response.stack = data.stack;
          ret.response.extraDebug = data.extraDebug;
        }

        res
          .status(handler.status)
          .json(ret);
        break;

      case TYPE_HTML: /////
        const html = compileHTML({
          req,
          res,
          data,
          debug,
        });

        res
          .status(data.status)
          .set('Content-Type', 'text/html')
          .write(html);
        break;

      default: /////
        const text = compileText({
          req,
          res,
          data,
          debug,
        });
        res
          .status(data.status)
          .set('Content-Type', 'text/plain')
          .write(text);
        break;
    }

    log('%O', {
      response: data,
      request: {
        accessurl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        headers: req.headers,
        hostname: req.hostname,
        ip: req.ip,
        ips: req.ips,
        originalUrl: req.originalUrl,
        url: req.url,
        path: req.path,
        httpVersion: req.httpVersion,
        method: req.method,
        protocol: req.protocol,
        params: req.params,
        query: req.query
      }
    });

    ///
    res.end();

    if (final) {
      final(req, res, handler);
    }

  };
};
