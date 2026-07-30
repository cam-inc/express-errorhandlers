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
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.status, 500);
    assert.equal(response.body.response.message, 'Test Error');
  });

  it('should not include stack, extraDebug, or request in response', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Sensitive Test');
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.stack, undefined);
    assert.equal(response.body.response.extraDebug, undefined);
    assert.equal(response.body.request, undefined);
  });

  it('should not include sensitive info in response', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Debug Test');
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .set('x-secret-header', 'sensitive-value')
      .set('x-forwarded-client-cert', 'spiffe://cluster.local/ns/test')
      .expect(500);

    assert.equal(response.body.response.stack, undefined);
    assert.equal(response.body.response.extraDebug, undefined);
    assert.equal(response.body.request, undefined);
    const body = JSON.stringify(response.body);
    assert.ok(!body.includes('sensitive-value'), 'Response must not contain request headers');
    assert.ok(!body.includes('spiffe://'), 'Response must not contain SPIFFE IDs');
  });

  it('should not include extraDebug content in response', async () => {
    const app = express();
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const handler = new Handler(new Error('test'), 500, 'Test', {}, { internalSecret: 'hidden' });
      next(handler);
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    const body = JSON.stringify(response.body);
    assert.ok(!body.includes('internalSecret'), 'Response body must not contain extraDebug content');
    assert.ok(!body.includes('hidden'), 'Response body must not contain extraDebug values');
  });

  it('should return HTML response with Accept: text/html', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('HTML Test');
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'text/html')
      .expect(500);

    assert.ok(response.text.includes('HTML Test') || response.text.length > 0);
    assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
  });

  it('should not include stack trace or request details in HTML response', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('HTML Stack Test');
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'text/html')
      .set('x-secret-header', 'sensitive-value')
      .expect(500);

    assert.ok(!response.text.includes('Stack trace'), 'HTML response must not contain stack trace section');
    assert.ok(!response.text.includes('Extra debug'), 'HTML response must not contain extra debug section');
    assert.ok(!response.text.includes('sensitive-value'), 'HTML response must not contain request headers');
  });

  it('should return text/plain response by default', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Plain Text Test');
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'text/plain')
      .expect(500);

    assert.equal(response.headers['content-type'], 'text/plain; charset=utf-8');
  });

  it('should not include stack trace or request details in text response', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Text Stack Test');
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'text/plain')
      .set('x-secret-header', 'sensitive-value')
      .expect(500);

    assert.ok(!response.text.includes('Stack trace'), 'Text response must not contain stack trace');
    assert.ok(!response.text.includes('Extra debug'), 'Text response must not contain extra debug');
    assert.ok(!response.text.includes('Headers'), 'Text response must not contain request headers');
    assert.ok(!response.text.includes('sensitive-value'), 'Text response must not contain request header values');
  });

  it('should handle Handler instance', async () => {
    const app = express();
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const handler = new Handler(undefined, 503, 'Service Unavailable', { code: 'E-503' });
      next(handler);
    });
    app.use(errorHandler());

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
    app.use(errorHandler({ status: 502 }));

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
    app.use(errorHandler({ message: 'Custom Message' }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.message, 'Custom Message');
  });

  it('should include extra in response', async () => {
    const app = express();
    app.get('/test', () => {
      throw new Error('Test');
    });
    app.use(errorHandler({
      extra: { foo: 'bar' },
    }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.extra.foo, 'bar');
  });

  it('should call final callback with full handler including stack and extraDebug', async () => {
    let finalCalled = false;
    let finalHandler: Handler | undefined;

    const app = express();
    app.get('/test', () => {
      throw new Error('Final Test');
    });
    app.use(errorHandler({
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
    assert.ok(finalHandler.stack, 'Handler passed to final must still have stack for server-side logging');
  });

  it('should handle regular Error vs Handler differently', async () => {
    const app = express();

    app.get('/error', () => {
      throw new Error('Regular Error');
    });

    app.get('/handler', (_req: Request, _res: Response, next: NextFunction) => {
      next(new Handler(undefined, 400, 'Handler Error', { type: 'handler' }));
    });

    app.use(errorHandler());

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

  it('should honor err.status on a plain Error (basic-auth-connect style)', async () => {
    const app = express();
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const err = new Error('Bad Request') as Error & { status?: number };
      err.status = 400;
      next(err);
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(400);

    assert.equal(response.body.response.status, 400);
  });

  it('should honor err.statusCode on a plain Error', async () => {
    const app = express();
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const err = new Error('Forbidden') as Error & { statusCode?: number };
      err.statusCode = 403;
      next(err);
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(403);

    assert.equal(response.body.response.status, 403);
  });

  it('should fall back to 500 when err.status is out of the 400-599 range', async () => {
    const app = express();
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const err = new Error('Weird') as Error & { status?: number };
      err.status = 0;
      next(err);
    });
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.status, 500);
  });

  it('should let options.status override err.status', async () => {
    const app = express();
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const err = new Error('Bad Request') as Error & { status?: number };
      err.status = 400;
      next(err);
    });
    app.use(errorHandler({ status: 502 }));

    const response = await supertest(app)
      .get('/test')
      .set('Accept', 'application/json')
      .expect(502);

    assert.equal(response.body.response.status, 502);
  });

  it('should handle custom HTML template string', async () => {
    const customHTMLTemplate = 'html\n  head\n    title Error\n  body\n    h1= data.message\n    p Status: #{data.status}';
    const customTextTemplate = 'p= data.message';

    const app = express();
    app.get('/test', () => {
      throw new Error('Custom Template Test');
    });

    app.use(errorHandler({
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
});
