import {test} from 'node:test';
import {Renderer, TextComponent} from '../renderer';
import * as assert from 'node:assert/strict';
import {interceptStdout} from './utils';
import * as constants from '../constants';

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

function createRendererOutput(text: string) {
  return constants.CLEAR_LINE + constants.HIDE_CURSOR + text + '\n';
}

test('Renderer', async (t) => {
  await t.test('displays TextComponent', async () => {
    const stdout = await interceptStdout(async () => {
      const renderer = new Renderer();
      renderer.addComponent(new TextComponent('lorem ipsum dolor'));
    });
    assert.equal(stdout, createRendererOutput('lorem ipsum dolor'));
  });
});
