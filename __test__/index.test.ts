import assert from 'assert';
import { Handler } from '../src';
import { errorHandler as errorHandler1, notFound as notFound1, skipOkHandler as skipOkHandler1 } from '../src/middleware';
import errorHandler from '../src/middleware/error_handler';
import notFound from '../src/middleware/not_found';
import skipOkHandler from '../src/middleware/skip_ok_hander';

describe('Basic test case', () => {
  it('Function call', () => {
    assert.ok(notFound1());
    assert.ok(notFound());
    assert.ok(skipOkHandler());
    assert.ok(skipOkHandler1());
    assert.ok(errorHandler());
    assert.ok(errorHandler1());

  });

  it('Simple new Handler', () => {
    const handler = new Handler();

    assert.equal(handler.status, 500);
    assert.ok(handler.error instanceof Error);
    assert.equal(handler.message, 'Server Error');
    assert.ok(handler.extra);
    assert.ok(handler.extraDebug);

    const data = handler.toData();

    assert.equal(data.status, 500);
    assert.equal(data.message, 'Server Error');
    assert.ok(data.extra);
    assert.equal(data.stack.substring(0, 5), 'Error');
    assert.ok(data.extraDebug);
  });

  it('Custom new Handler', () => {
    const error = new Error('Custom');
    const handler = new Handler(error, 555, 'Custom Server Error', {foo: true}, {bar: true});

    assert.equal(handler.status, 555);
    assert.ok(handler.error instanceof Error);
    assert.equal(handler.message, 'Custom Server Error');
    assert.equal(handler.extra.foo, true);
    assert.equal(handler.extraDebug.bar, true);

    const data = handler.toData();

    assert.equal(data.status, 555);
    assert.equal(data.message, 'Custom Server Error');
    assert.equal(data.extra.foo, true);
    assert.equal(data.stack.substring(0, 5), 'Error');
    assert.equal(data.extraDebug.bar, true);
  });

});
