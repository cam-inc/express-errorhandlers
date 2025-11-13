import assert from 'assert';
import express from 'express';
import supertest from 'supertest';
import skipOkHandler from '../src/middleware/skip_ok_hander';
import errorHandler from '../src/middleware/error_handler';

describe('skipOkHandler middleware', () => {
  it('should skip /favicon.ico with 200 OK by default', async () => {
    const app = express();
    app.use((_req, _res, next) => {
      next(new Error('Test Error'));
    });
    app.use(skipOkHandler());
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/favicon.ico')
      .expect(200);

    assert.equal(response.status, 200);
  });

  it('should skip /robots.txt with 200 OK by default', async () => {
    const app = express();
    app.use((_req, _res, next) => {
      next(new Error('Test Error'));
    });
    app.use(skipOkHandler());
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/robots.txt')
      .expect(200);

    assert.equal(response.status, 200);
  });

  it('should not skip other paths', async () => {
    const app = express();
    app.use((_req, _res, next) => {
      next(new Error('Test Error'));
    });
    app.use(skipOkHandler());
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/other-path')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.status, 500);
    assert.equal(response.body.response.message, 'Test Error');
  });

  it('should use custom paths', async () => {
    const app = express();
    app.use((_req, _res, next) => {
      next(new Error('Test Error'));
    });
    app.use(skipOkHandler(['/custom-skip', '/another-skip']));
    app.use(errorHandler({ debug: false }));

    const response1 = await supertest(app)
      .get('/custom-skip')
      .expect(200);

    const response2 = await supertest(app)
      .get('/another-skip')
      .expect(200);

    const response3 = await supertest(app)
      .get('/favicon.ico')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response1.status, 200);
    assert.equal(response2.status, 200);
    assert.equal(response3.body.response.status, 500);
  });

  it('should use custom callback function', async () => {
    let customCalled = false;

    const customFn = (_err: Error, _req: express.Request, res: express.Response) => {
      customCalled = true;
      res.status(204).end();
    };

    const app = express();
    app.use((_req, _res, next) => {
      next(new Error('Test Error'));
    });
    app.use(skipOkHandler(['/skip'], customFn));
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/skip')
      .expect(204);

    assert.ok(customCalled);
    assert.equal(response.status, 204);
  });

  it('should pass error to next middleware when path does not match', async () => {
    const app = express();
    let nextCalled = false;

    app.use((_req, _res, next) => {
      next(new Error('Test Error'));
    });

    app.use(skipOkHandler(['/skip']));

    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      nextCalled = true;
      res.status(500).json({ error: err.message });
    });

    await supertest(app)
      .get('/no-skip')
      .expect(500);

    assert.ok(nextCalled);
  });

  it('should handle empty custom paths array', async () => {
    const app = express();
    app.use((_req, _res, next) => {
      next(new Error('Test Error'));
    });
    app.use(skipOkHandler([]));
    app.use(errorHandler({ debug: false }));

    const response = await supertest(app)
      .get('/favicon.ico')
      .set('Accept', 'application/json')
      .expect(500);

    assert.equal(response.body.response.status, 500);
  });

  it('should work with both custom paths and custom callback', async () => {
    let callbackInvoked = false;

    const app = express();
    app.use((_req, _res, next) => {
      next(new Error('Test Error'));
    });

    app.use(skipOkHandler(
      ['/custom'],
      (_err, _req, res) => {
        callbackInvoked = true;
        res.status(202).end();
      }
    ));

    app.use(errorHandler({ debug: false }));

    await supertest(app)
      .get('/custom')
      .expect(202);

    assert.ok(callbackInvoked);
  });
});
