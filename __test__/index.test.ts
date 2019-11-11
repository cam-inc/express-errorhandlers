import assert from 'assert';
import expressErrorHandlers from '../';

describe('Basic test case', () => {
  it('Function call', () => {
    assert.ok(expressErrorHandlers.middleware);
    assert.ok(expressErrorHandlers.middleware.notFound);
    assert.ok(expressErrorHandlers.middleware.errorHandler);
    assert.ok(expressErrorHandlers.middleware.skipOkHandler);
    assert.ok(expressErrorHandlers.Handler);
  });

  it('Simple new Handler', () => {
    const handler = new expressErrorHandlers.Handler();

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
    const handler = new expressErrorHandlers.Handler(error, 555, 'Custom Server Error', {foo: true}, {bar: true});

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
