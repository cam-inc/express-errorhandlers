import assert from 'assert';
import express from 'express';
import supertest from 'supertest';
import notFound from '../src/middleware/not_found';
import errorHandler from '../src/middleware/error_handler';
import { Handler } from '../src';

describe('notFound middleware', () => {
  it('should return 404 with default message', async () => {
    const app = express();
    app.use(notFound());
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/nonexistent')
      .set('Accept', 'application/json')
      .expect(404);

    assert.equal(response.body.response.status, 404);
    assert.equal(response.body.response.message, 'Not Found');
  });

  it('should return 404 with custom message', async () => {
    const app = express();
    app.use(notFound('Custom Not Found'));
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/nonexistent')
      .set('Accept', 'application/json')
      .expect(404);

    assert.equal(response.body.response.status, 404);
    assert.equal(response.body.response.message, 'Custom Not Found');
  });

  it('should include custom extra data', async () => {
    const app = express();
    app.use(notFound('Not Found', { code: 'E-404-001' }));
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/nonexistent')
      .set('Accept', 'application/json')
      .expect(404);

    assert.equal(response.body.response.extra.code, 'E-404-001');
  });

  it('should not include extraDebug in response', async () => {
    const app = express();
    app.use(notFound('Not Found', {}, { debugInfo: 'test' }));
    app.use(errorHandler());

    const response = await supertest(app)
      .get('/nonexistent')
      .set('Accept', 'application/json')
      .expect(404);

    assert.equal(response.body.response.extraDebug, undefined);
    const body = JSON.stringify(response.body);
    assert.ok(!body.includes('debugInfo'), 'Response must not contain extraDebug content');
  });

  it('should pass Handler instance to next middleware', async () => {
    let handlerReceived = false;
    let handlerStatus = 0;

    const app = express();
    app.use(notFound());
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      handlerReceived = err instanceof Handler;
      handlerStatus = (err as Handler).status;
      res.status(404).end();
    });

    await supertest(app)
      .get('/test')
      .expect(404);

    assert.ok(handlerReceived);
    assert.equal(handlerStatus, 404);
  });

  it('should work with all parameter combinations', async () => {
    const app1 = express();
    app1.use(notFound());
    app1.use(errorHandler());

    const app2 = express();
    app2.use(notFound('Custom'));
    app2.use(errorHandler());

    const app3 = express();
    app3.use(notFound('Custom', { foo: 'bar' }));
    app3.use(errorHandler());

    const app4 = express();
    app4.use(notFound('Custom', { foo: 'bar' }, { baz: 'qux' }));
    app4.use(errorHandler());

    const res1 = await supertest(app1).get('/').set('Accept', 'application/json');
    const res2 = await supertest(app2).get('/').set('Accept', 'application/json');
    const res3 = await supertest(app3).get('/').set('Accept', 'application/json');
    const res4 = await supertest(app4).get('/').set('Accept', 'application/json');

    assert.equal(res1.body.response.message, 'Not Found');
    assert.equal(res2.body.response.message, 'Custom');
    assert.equal(res3.body.response.extra.foo, 'bar');
    assert.equal(res4.body.response.extraDebug, undefined);
  });
});
