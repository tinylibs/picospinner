import {test} from 'node:test';
import {Renderer, TextComponent} from '../renderer.js';
import * as assert from 'node:assert/strict';
import {interceptStdout, suppressStdout} from './utils.js';
import * as constants from '../constants.js';

test('TextComponent', async (t) => {
  const component = new TextComponent('lorem ipsum dolor');

  await t.test('Instantiates with correct value', () => {
    assert.equal(component.output(), 'lorem ipsum dolor');
  });

  await t.test('.setText behaves correctly', () => {
    let onChangeCalled = false;
    component.onChange = () => (onChangeCalled = true);
    component.setText('sit amet');
    assert.equal(component.output(), 'sit amet');
    assert.ok(onChangeCalled);
  });

  await t.test('finish behaves correctly', () => {
    let finishCallbackRuns = 0;
    component.onFinish = () => finishCallbackRuns++;

    component.finish();
    component.finish();

    assert.ok(component.finished);
    assert.equal(finishCallbackRuns, 1);
  });
});

function createRendererOutput(text: string[], lastLinesCount = 0) {
  return (constants.CLEAR_LINE + constants.UP_LINE).repeat(lastLinesCount) + constants.CLEAR_LINE + constants.HIDE_CURSOR + text.join('\n') + '\n';
}

test('Renderer', async (t) => {
  await t.test('displays TextComponent', async () => {
    const stdout = await interceptStdout(async () => {
      const renderer = new Renderer();
      renderer.addComponent(new TextComponent('lorem ipsum dolor'));
    });
    assert.equal(stdout, createRendererOutput(['lorem ipsum dolor']));
  });

  await t.test('displays multiple TextComponents', async () => {
    const stdout = await interceptStdout(async () => {
      const renderer = new Renderer();
      renderer.addComponent(new TextComponent('lorem ipsum dolor'));
      renderer.addComponent(new TextComponent('sit amet'));
    });
    assert.equal(stdout, createRendererOutput(['lorem ipsum dolor']) + createRendererOutput(['lorem ipsum dolor', 'sit amet'], 1));
  });

  await t.test('updates TextComponents', async () => {
    const stdout = await interceptStdout(async () => {
      const renderer = new Renderer();
      const changeable = new TextComponent('this will change');
      renderer.addComponent(new TextComponent('foo'));
      renderer.addComponent(changeable);
      renderer.addComponent(new TextComponent('bar'));
      changeable.setText('changed');
    });
    assert.equal(stdout, createRendererOutput(['foo']) + createRendererOutput(['foo', 'this will change'], 1) + createRendererOutput(['foo', 'this will change', 'bar'], 2) + createRendererOutput(['foo', 'changed', 'bar'], 3));
  });

  await t.test('finishes when all components are finished', async () => {
    const component1 = new TextComponent(''),
      component2 = new TextComponent(''),
      component3 = new TextComponent('');

    const revertStdoutSuppression = suppressStdout();

    try {
      const renderer = new Renderer();
      renderer.addComponent(component1);
      renderer.addComponent(component2);
      renderer.addComponent(component3);

      component1.finish();
      component3.finish();
      assert.equal(renderer['components'].length, 3);

      renderer.removeComponent(component1);
      assert.equal(renderer['components'].length, 2);
      component2.finish();
      assert.equal(renderer['components'].length, 0);
    } finally {
      revertStdoutSuppression();
    }
  });

  await t.test('emits show cursor after finish', async () => {
    const stdout = await interceptStdout(async () => {
      const renderer = new Renderer();
      const component = new TextComponent('');
      renderer.addComponent(component);
      component.finish();
    });
    assert.ok(stdout.endsWith(constants.SHOW_CURSOR), 'shows cursor');
  });

  await t.test('emits show cursor after component removed', async () => {
    const stdout = await interceptStdout(async () => {
      const renderer = new Renderer();
      const component = new TextComponent('');
      renderer.addComponent(component);
      renderer.removeComponent(component);
    });
    assert.ok(stdout.endsWith(constants.SHOW_CURSOR), 'shows cursor');
  });
});
