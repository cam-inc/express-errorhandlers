import assert from 'assert';
import supertest from 'supertest';

import app from '../demo';

describe('HTTP Request call', () => {
  let request: ReturnType<typeof supertest>;

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
        assert.equal(response.stack, undefined);
        assert.equal(response.extraDebug, undefined);
        assert.equal(res.body.request, undefined);
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
        assert.equal(response.stack, undefined);
        assert.equal(response.extraDebug, undefined);
        assert.equal(res.body.request, undefined);
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
        assert.equal(response.stack, undefined);
        assert.equal(response.extraDebug, undefined);
        assert.equal(res.body.request, undefined);
      });
  });

});
