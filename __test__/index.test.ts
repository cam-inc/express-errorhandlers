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
    assert.ok(handler instanceof Error);
    assert.equal(handler.message, 'Server Error');
    assert.ok(handler.extra);
    assert.ok(handler.extraDebug);

    const data = handler.toData();

    assert.equal(data.status, 500);
    assert.equal(data.message, 'Server Error');
    assert.ok(data.extra);
    assert.equal(data.stack?.substring(0, 6), 'Server');
    assert.ok(data.extraDebug);
  });

  it('Custom new Handler', () => {
    const error = new Error('Custom');
    const handler = new Handler(error, 555, 'Custom Server Error', {foo: true}, {bar: true});

    assert.equal(handler.status, 555);
    assert.ok(handler instanceof Error);
    assert.equal(handler.message, 'Custom Server Error');
    assert.equal(handler.extra.foo, true);
    assert.equal(handler.extraDebug.bar, true);

    const data = handler.toData();

    assert.equal(data.status, 555);
    assert.equal(data.message, 'Custom Server Error');
    assert.equal(data.extra.foo, true);
    assert.equal(data.stack?.substring(0, 5), 'Error');
    assert.equal(data.extraDebug.bar, true);
  });

  it('Handler with only error parameter', () => {
    const error = new Error('Test Error');
    const handler = new Handler(error);

    assert.equal(handler.status, 500);
    assert.equal(handler.message, 'Test Error');
    assert.ok(handler.extra);
    assert.ok(handler.extraDebug);
    assert.ok(handler.stack?.includes('Test Error'));
  });

  it('Handler message priority (message > error.message)', () => {
    const error = new Error('Error Message');
    const handler = new Handler(error, undefined, 'Custom Message');

    assert.equal(handler.message, 'Custom Message');
  });

  it('Handler preserves original error stack', () => {
    const error = new Error('Original Error');
    const originalStack = error.stack;
    const handler = new Handler(error);

    assert.equal(handler.stack, originalStack);
  });

  it('Handler with status 0', () => {
    const handler = new Handler(undefined, 0);

    assert.equal(handler.status, 500); // Should fallback to default
  });

  it('Handler with empty extra and extraDebug', () => {
    const handler = new Handler(undefined, 400, 'Bad Request', {}, {});

    assert.deepEqual(handler.extra, {});
    assert.deepEqual(handler.extraDebug, {});
  });

  it('Handler name is set from message', () => {
    const handler1 = new Handler(undefined, 400, 'Custom Error');
    assert.equal(handler1.name, 'Custom Error');

    const error = new Error('Error Message');
    const handler2 = new Handler(error);
    assert.equal(handler2.name, 'Error Message');

    const handler3 = new Handler();
    assert.equal(handler3.name, 'Server Error');
  });

  it('Handler propagates code from original error', () => {
    const error = Object.assign(new Error('Validation Failed'), { code: 'SCHEMA_VALIDATION_FAILED' });
    const handler = new Handler(error, 400, 'Bad Request');

    assert.equal(handler.code, 'SCHEMA_VALIDATION_FAILED');
  });

  it('Handler code is undefined when original error has no code', () => {
    const error = new Error('No Code');
    const handler = new Handler(error);

    assert.equal(handler.code, undefined);
  });

  it('Handler code is undefined when no error is provided', () => {
    const handler = new Handler(undefined, 500, 'Server Error');

    assert.equal(handler.code, undefined);
  });

});
