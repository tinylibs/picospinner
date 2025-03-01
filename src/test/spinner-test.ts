import * as assert from 'node:assert/strict';
import {test} from 'node:test';
import {ColorOptions, Spinner, Symbols, renderer} from '../index.js';
import {createFinishingRenderedLine, createRenderedLine, createRenderedOutput, interceptStdout, suppressStdout, TickMeasuredSpinner} from './utils.js';
import process from 'node:process';
import * as constants from '../constants.js';

async function testEndMethod(method: keyof Symbols, type: 'str' | 'obj', customSymbol?: string, colors?: boolean | ColorOptions) {
  renderer._reset();

  const stdout = await interceptStdout(async () => {
    const spinner = new Spinner(undefined, {
      symbols: customSymbol ? {[method]: customSymbol} : undefined,
      colors
    });
    spinner.start();
    spinner[method](type === 'str' ? 'lorem ipsum dolor' : {text: 'lorem ipsum dolor'});
  });

  assert.equal(stdout, createRenderedLine(constants.DEFAULT_FRAMES[0], '', true, colors, 'spinner') + createFinishingRenderedLine(customSymbol ?? constants.DEFAULT_SYMBOLS[method], 'lorem ipsum dolor', colors, method));
}

test('end methods', async (t) => {
  await t.test('.info', async () => {
    await testEndMethod('info', 'str');
    await testEndMethod('info', 'obj');
    await testEndMethod('info', 'obj', 'I');
    await testEndMethod('info', 'obj', 'I', true);
    await testEndMethod('info', 'obj', 'I', {info: 'bgBlack'});
  });

  await t.test('.succeed', async () => {
    await testEndMethod('succeed', 'str');
    await testEndMethod('succeed', 'obj');
    await testEndMethod('succeed', 'obj', 'Success');
    await testEndMethod('succeed', 'obj', 'Success', true);
    await testEndMethod('succeed', 'obj', 'Success', {succeed: ['cyan', 'bold'], text: 'red'});
  });

  await t.test('.warn', async () => {
    await testEndMethod('warn', 'str');
    await testEndMethod('warn', 'obj');
    await testEndMethod('warn', 'obj', '⚠');
    await testEndMethod('warn', 'obj', '⚠', true);
    await testEndMethod('warn', 'obj', '⚠', {warn: 'overlined'});
  });

  await t.test('.fail', async () => {
    await testEndMethod('fail', 'str');
    await testEndMethod('fail', 'obj');
    await testEndMethod('fail', 'obj', ':(', false);
    await testEndMethod('fail', 'obj', ':(', true);
    await testEndMethod('fail', 'obj', ':(', {fail: 'redBright'});
  });

  await t.test('.stop', async () => {
    const stdout = await interceptStdout(async () => {
      const spinner = new Spinner();
      spinner.start();
      spinner.stop();
    });

    assert.equal(stdout, createRenderedLine(constants.DEFAULT_FRAMES[0], '', true) + constants.CLEAR_LINE + constants.UP_LINE + constants.CLEAR_LINE + constants.SHOW_CURSOR);
  });

  await t.test('set display with no symbol', async () => {
    const stdout = await interceptStdout(async () => {
      const spinner = new Spinner();
      spinner.start();
      spinner.setDisplay({symbol: ''});
    });

    assert.equal(stdout, createRenderedLine(constants.DEFAULT_FRAMES[0], '', true) + createFinishingRenderedLine('', ''));
  });

  await t.test('process exit', async () => {
    let exitCode: unknown = 0;
    const exitStub = ((code: unknown) => {
      exitCode = code;
    }) as typeof process.exit;
    const originalExit = process.exit;
    process.exit = exitStub;

    try {
      const stdout = await interceptStdout(async () => {
        const spinner = new Spinner();
        spinner.start();
        // TODO (43081j): maybe this'll spook other things? if something is
        // listening for SIGTERM
        process.emit('SIGTERM', 'SIGTERM');
      });

      assert.equal(stdout, createRenderedLine(constants.DEFAULT_FRAMES[0], '', true) + constants.CLEAR_LINE + constants.UP_LINE + constants.CLEAR_LINE + constants.SHOW_CURSOR);
      assert.equal(exitCode, 128 + 15);
    } finally {
      process.exit = originalExit;
    }
  });

  await t.test('process exit (via exit event)', async () => {
    let exitCode: unknown = 0;
    const exitStub = ((code: unknown) => {
      exitCode = code;
    }) as typeof process.exit;
    const originalExit = process.exit;
    process.exit = exitStub;

    try {
      await interceptStdout(async () => {
        const spinner = new Spinner();
        spinner.start();
        // TODO (43081j): maybe this'll spook other things? if something is
        // listening for SIGTERM
        process.emit('exit', 1);
      });

      assert.equal(exitCode, 1);
    } finally {
      process.exit = originalExit;
    }
  });

  await t.test('restart finished spinner with new component', async () => {
    const unsuppressStdout = suppressStdout();

    const spinner = new Spinner();
    try {
      spinner.start();
      spinner.succeed();
      assert.ok(spinner['component'].finished, 'component is finished');
      spinner.start();
      assert.ok(!spinner['component'].finished, 'component is not finished');
      spinner.stop();
    } catch (err) {
      spinner.stop();
      throw err;
    } finally {
      unsuppressStdout();
    }
  });
});

async function testSpinner(frames?: string[], text?: string, symbolFormatter?: (v: string) => string, colors?: ColorOptions | boolean) {
  renderer._reset();

  const spinner = new TickMeasuredSpinner({text, symbolFormatter}, {frames, colors});

  const stdout = await interceptStdout(
    () =>
      new Promise((resolve) => {
        spinner.start();
        setTimeout(() => {
          spinner.stop();
          resolve();
        }, constants.DEFAULT_TICK_MS * 13);
      })
  );

  assert.ok(spinner.tickCount >= 11 && spinner.tickCount <= 14, `Spinner tick count (${spinner.tickCount}) is not between 11-14`);

  if (!frames) frames = constants.DEFAULT_FRAMES;

  assert.equal(
    stdout,
    new Array(spinner.tickCount)
      .fill(undefined)
      .map((_, i) => {
        return createRenderedLine(frames[i % frames.length], text ?? '', i === 0, colors, 'spinner', symbolFormatter);
      })
      .join('') +
      constants.CLEAR_LINE +
      constants.UP_LINE +
      constants.CLEAR_LINE +
      constants.SHOW_CURSOR
  );
}

test('spinner', async (t) => {
  await t.test('spins', () => testSpinner());
  await t.test('spins with custom frames', () => testSpinner(['-', '\\', '|', '/']));
  await t.test('spins with custom text', () => testSpinner(undefined, 'lorem ipsum dolor'));
  await t.test('spins with custom formatter', () => testSpinner(undefined, 'lorem ipsum dolor', (v) => 'abc' + v));
  await t.test('changing text', async () => {
    const stdout = await interceptStdout(
      () =>
        new Promise((resolve) => {
          const spinner = new Spinner('foo');
          spinner.start();
          setTimeout(() => spinner.setText('bar'), 400);
          setTimeout(() => spinner.setText('baz'), 700);
          setTimeout(() => {
            spinner.stop();
            resolve();
          }, 1000);
        })
    );
    assert.match(stdout, /foo/g);
    assert.match(stdout, /bar/g);
    assert.match(stdout, /baz/g);
  });
  await t.test('renders multiple spinners', async () => {
    const stdout = await interceptStdout(() => {
      const spinner1 = new Spinner('foo');
      spinner1.start();
      const spinner2 = new Spinner('bar');
      spinner2.start();
      spinner1.stop();
      spinner2.stop();
    });

    assert.equal(
      stdout,
      createRenderedLine(constants.DEFAULT_FRAMES[0], 'foo', true) +
        createRenderedOutput(
          [
            {
              symbol: constants.DEFAULT_FRAMES[0],
              text: 'foo'
            },
            {
              symbol: constants.DEFAULT_FRAMES[0],
              text: 'bar'
            }
          ],
          false,
          1
        ) +
        createRenderedOutput(
          [
            {
              symbol: constants.DEFAULT_FRAMES[0],
              text: 'bar'
            }
          ],
          false,
          2
        ) +
        constants.CLEAR_LINE +
        constants.UP_LINE +
        constants.CLEAR_LINE +
        constants.SHOW_CURSOR
    );
  });
  await t.test('displays colors', () => testSpinner(undefined, 'lorem ipsum dolor', undefined, true));
  await t.test('displays custom colors', () =>
    testSpinner(undefined, 'lorem ipsum dolor', undefined, {
      succeed: 'magenta',
      warn: 'bgMagenta',
      fail: 'greenBright',
      info: 'inverse',
      spinner: 'overlined',
      text: 'grey'
    })
  );
  await t.test('displays colors with symbol formatter', () => testSpinner(undefined, 'lorem ipsum dolor', (s) => `a${s}a`, true));
});
