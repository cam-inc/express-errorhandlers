import assert from 'assert';
import supertest from 'supertest';

import app from '../demo';

describe('HTTP Request call', () => {
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    request = supertest(app);
  });

  it('/ 200 OK', () => {
    return request
      .get('/')
      .expect(200)
      .then(res => {
        assert.equal(res.body['Access URLs'].length, 3)
      });
  });

  it('/401', () => {
    return request
      .get('/401?foo=bar')
      .expect(401)
      .then(res => {
        const response = res.body.response;
        assert.equal(response.status, 401);
        assert.equal(response.message, 'Unauthorized');
        assert.equal(response.extra.code, 'A-401-000000');
        assert.ok(response.stack);
        assert.ok(response.extraDebug);

        const request = res.body.request;
        assert.ok(request.accessurl);
        assert.equal(request.headers['user-agent'].substring(0, 16), 'node-superagent/');
        assert.equal(request.hostname, '127.0.0.1');
        assert.equal(request.originalUrl, '/401?foo=bar');
        assert.ok(request.ip);
        assert.ok(request.ips);
        assert.equal(request.url, '/401?foo=bar');
        assert.equal(request.path, '/401');
        assert.equal(request.httpVersion, '1.1');
        assert.equal(request.method, 'GET');
        assert.equal(request.protocol, 'http');
        assert.ok(request.params);
        assert.equal(request.query.foo, 'bar');

      });
  });

  it('/502', () => {
    return request
      .get('/502?foo=bar')
      .expect(502)
      .then(res => {
        const response = res.body.response;
        assert.equal(response.status, 502);
        assert.equal(response.message, 'Bad Gateway');
        assert.equal(response.extra.code, 'A-502-000000');
        assert.ok(response.stack);
        assert.ok(response.extraDebug);

        const request = res.body.request;
        assert.ok(request.accessurl);
        assert.equal(request.headers['user-agent'].substring(0, 16), 'node-superagent/');
        assert.equal(request.hostname, '127.0.0.1');
        assert.equal(request.originalUrl, '/502?foo=bar');
        assert.ok(request.ip);
        assert.ok(request.ips);
        assert.equal(request.url, '/502?foo=bar');
        assert.equal(request.path, '/502');
        assert.equal(request.httpVersion, '1.1');
        assert.equal(request.method, 'GET');
        assert.equal(request.protocol, 'http');
        assert.ok(request.params);
        assert.equal(request.query.foo, 'bar');
      });
  });

  it('/500', () => {
    return request
      .get('/500?foo=bar')
      .expect(555)
      .then(res => {
        const response = res.body.response;
        assert.equal(response.status, 555);
        assert.equal(response.message, 'Demo Server Error');
        assert.equal(response.extra.message, 'page server error.');
        assert.ok(response.stack);
        assert.equal(response.extraDebug.env, 'test');

        const request = res.body.request;
        assert.ok(request.accessurl);
        assert.equal(request.headers['user-agent'].substring(0, 16), 'node-superagent/');
        assert.equal(request.hostname, '127.0.0.1');
        assert.equal(request.originalUrl, '/500?foo=bar');
        assert.ok(request.ip);
        assert.ok(request.ips);
        assert.equal(request.url, '/500?foo=bar');
        assert.equal(request.path, '/500');
        assert.equal(request.httpVersion, '1.1');
        assert.equal(request.method, 'GET');
        assert.equal(request.protocol, 'http');
        assert.ok(request.params);
        assert.equal(request.query.foo, 'bar');
      });
  });

});
