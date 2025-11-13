import assert from 'assert';
import express, { NextFunction, Request, Response } from 'express';
import supertest from 'supertest';
import errorHandler from '../src/middleware/error_handler';
import { Handler } from '../src';

describe('errorHandler middleware', () => {
  it('should return JSON response with Accept: application/json', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Test Error');
    });
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.status, 500);
    assert.equal(response.body.response.message, 'Test Error');
    assert.equal(response.body.response.stack, '');
    assert.deepEqual(response.body.request, {});
  });

  it('should return JSON with debug info when debug: true', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Debug Test');
    });
    app.use(errorHandler({ debug: true }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.status, 500);
    assert.ok(response.body.response.stack);
    assert.ok(response.body.request.method);
    assert.equal(response.body.request.method, 'GET');
    assert.equal(response.body.request.path, '/test');
  });

  it('should return HTML response with Accept: text/html', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('HTML Test');
    });
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'text/html')
      .expect(500);

    assert.ok(response.text.includes('HTML Test') || response.text.length > 0);
    assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
  });

  it('should return text/plain response by default', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Plain Text Test');
    });
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'text/plain')
      .expect(500);

    assert.equal(response.headers['content-type'], 'text/plain; charset=utf-8');
  });

  it('should handle Handler instance', async () => {
    const app = express();
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const handler = new Handler(undefined, 503, 'Service Unavailable', { code: 'E-503' });
      next(handler);
    });
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(503);

    assert.equal(response.body.response.status, 503);
    assert.equal(response.body.response.message, 'Service Unavailable');
    assert.equal(response.body.response.extra.code, 'E-503');
  });

  it('should use custom status from options', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Custom Status Test');
    });
    app.use(errorHandler({ status: 502, debug: false }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(502);

    assert.equal(response.body.response.status, 502);
  });

  it('should use custom message from options', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Original Message');
    });
    app.use(errorHandler({ message: 'Custom Message', debug: false }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.message, 'Custom Message');
  });

  it('should include extra and extraDebug from options', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Test');
    });
    app.use(errorHandler({
      extra: { foo: 'bar' },
      extraDebug: { baz: 'qux' },
      debug: true
    }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.extra.foo, 'bar');
    assert.equal(response.body.response.extraDebug.baz, 'qux');
  });

  it('should call final callback if provided', async () => {
    let finalCalled = false;
    let finalHandler: Handler | undefined;

    const app = express();
    app.get('/test', () => {
      throw new Error('Final Test');
    });
    app.use(errorHandler({
      debug: false,
      final: (_req, _res, handler) => {
        finalCalled = true;
        finalHandler = handler;
      }
    }));

    await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.ok(finalCalled);
    assert.ok(finalHandler);
    assert.ok(finalHandler instanceof Handler);
    assert.equal(finalHandler.message, 'Final Test');
  });

  it('should handle regular Error vs Handler differently', async () => {
    const app = express();

    app.get('/error', () => {
      throw new Error('Regular Error');
    });

    app.get('/handler', (_req: Request, _res: Response, next: NextFunction) => {
      next(new Handler(undefined, 400, 'Handler Error', { type: 'handler' }));
    });

    app.use(errorHandler({ debug: false }));

    const errorResponse = await supertest(app)
      .get('/error')
      .set('Accept', 'application/json')
      .expect(500);

    const handlerResponse = await supertest(app)
      .get('/handler')
      .set('Accept', 'application/json')
      .expect(400);

    assert.equal(errorResponse.body.response.status, 500);
    assert.equal(handlerResponse.body.response.status, 400);
    assert.equal(handlerResponse.body.response.extra.type, 'handler');
  });

  it('should handle custom HTML template string', async () => {
    const customHTMLTemplate = 'html\n  head\n    title Error\n  body\n    h1= data.message\n    p Status: #{data.status}';
    const customTextTemplate = 'p= data.message';

    const app = express();
    app.get('/test', () => {
      throw new Error('Custom Template Test');
    });

    app.use(errorHandler({
      debug: false,
      templateHTML: customHTMLTemplate,
      templateTEXT: customTextTemplate
    }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'text/html')
      .expect(500);

    assert.ok(response.text.includes('Custom Template Test'));
    assert.ok(response.text.includes('Status: 500'));
    assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
  });

  it('should handle custom TEXT template string', async () => {
    const customHTMLTemplate = 'html\n  body\n    h1= data.message';
    const customTextTemplate = 'h1 Error\np= data.message\np Status: #{data.status}';

    const app = express();
    app.get('/test', () => {
      throw new Error('Text Template Test');
    });

    app.use(errorHandler({
      debug: false,
      templateHTML: customHTMLTemplate,
      templateTEXT: customTextTemplate
    }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'text/plain')
      .expect(500);

    assert.ok(response.text.includes('Text Template Test'));
    assert.ok(response.text.includes('Status: 500'));
    assert.equal(response.headers['content-type'], 'text/plain; charset=utf-8');
  });

  it('should handle both custom HTML and TEXT template strings', async () => {
    const customHTMLTemplate = 'html\n  body\n    h1 HTML: #{data.message}';
    const customTextTemplate = 'p TEXT: #{data.message}';

    const app = express();
    app.get('/test', () => {
      throw new Error('Both Templates Test');
    });

    app.use(errorHandler({
      debug: false,
      templateHTML: customHTMLTemplate,
      templateTEXT: customTextTemplate
    }));

    const htmlResponse = await supertest(app)
      .get('/test')
      .set('Accept', 'text/html')
      .expect(500);

    const textResponse = await supertest(app)
      .get('/test')
      .set('Accept', 'text/plain')
      .expect(500);

    assert.ok(htmlResponse.text.includes('HTML: Both Templates Test'));
    assert.ok(textResponse.text.includes('TEXT: Both Templates Test'));
  });

  it('should handle Handler with undefined stack in debug mode', async () => {
    const app = express();
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const handler = new Handler(undefined, 500, 'No Stack Test');
      // Handler without error parameter has no stack initially
      handler.stack = undefined;
      next(handler);
    });
    app.use(errorHandler({ debug: true }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.status, 500);
    assert.equal(response.body.response.message, 'No Stack Test');
    assert.equal(response.body.response.stack, '');
  });
});
