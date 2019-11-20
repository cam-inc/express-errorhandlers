const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const debug = require('debug')('express-errorhandlers:demo');
const { Handler, middleware } = require('./');
const errorHandler = middleware.errorHandler;
const skipOkHandler = middleware.skipOkHandler;
const notFound = middleware.notFound;

///

const PORT = 3000;
const app = express();

app.use(logger('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/', (req, res, next) => { // eslint-disable-line
  res.status(200).json({
    'Access URLs': [
      'http://localhost:3000/401',
      'http://localhost:3000/502',
      'http://localhost:3000/500'
    ]
  });
});

app.get('/401', (req, res, next) => {
  next(new Handler(null, 401, 'Unauthorized', {
    code: 'A-401-000000'
  }));
});

app.get('/502', (req, res, next) => {
  next(new Handler(null, 502, 'Bad Gateway', {
    code: 'A-502-000000'
  }));
});

app.get('/500', (req, res, next) => {
  next(new Error(`${req.path} Server Error!!`));
});

///
app.use(skipOkHandler(
  ['/favicon.ico', '/sitemap.xml'],
  //fn: function() {...}
));

app.use(notFound(
  'Not Found :p', {
    message: 'page not found.'
  }, {
    env: process.env.NODE_ENV
  },
));

app.use(errorHandler({
  debug: process.env.NODE_ENV !== 'production',
  //templateHTML: {...}, // pug template string or pug file path (HTML)
  //templateHTMLOptions: {...}, // pug compile config (HTML)
  //templateTEXT: {...}, // pug template string or pug file path (TEXT)
  //templateTEXTOptions: {...}, // pug compile config (TEXT)
  status: 555, // default response status code
  message: 'Demo Server Error', // default error message
  extra: {message: 'page server error.'}, // Extended message object
  extraDebug: {env: process.env.NODE_ENV}, // Extended message object (only debug)
  final: (req, res, handler) => {
    //console.error('final. error:', handler); // log output
    debug('final call. %O', handler);
  }
}));


if (process.env.EXPRESS_ERRROHANDLERS_LISTEN) {
  app.listen(PORT, () => console.log(`demo app listening on port ${PORT}!`));
}

module.exports = app;
