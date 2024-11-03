import * as assert from 'node:assert/strict';
import test from 'node:test';
import {getStringWidth} from '../string-width.js';
import {countLines} from '../string-lines.js';

// Test cases taken from https://github.com/fabiospampinato/fast-string-truncated-width/blob/master/test/index.js

test('string width', async (t) => {
  await t.test('calculating the width of a string', () => {
    assert.equal(getStringWidth('hello'), 5);
    assert.equal(getStringWidth('\x1b[31mhello'), 5);
    assert.equal(getStringWidth('abcde'), 5);
    assert.equal(getStringWidth('古池や'), 6);
    assert.equal(getStringWidth('あいうabc'), 9);
    assert.equal(getStringWidth('あいう★'), 7);
    assert.equal(getStringWidth('±'), 1);
    assert.equal(getStringWidth('ノード.js'), 9);
    assert.equal(getStringWidth('你好'), 4);
    assert.equal(getStringWidth('안녕하세요'), 10);
    assert.equal(getStringWidth('A\uD83C\uDE00BC'), 5);
    assert.equal(getStringWidth('\u001B[31m\u001B[39m'), 0);
    assert.equal(getStringWidth('\u{231A}'), 2);
    assert.equal(getStringWidth('\u{2194}\u{FE0F}'), 2);
    assert.equal(getStringWidth('\u{1F469}'), 2);
    assert.equal(getStringWidth('\u{1F469}\u{1F3FF}'), 2);
    assert.equal(getStringWidth('\u{845B}\u{E0100}'), 2);
    assert.equal(getStringWidth('ปฏัก'), 3);
    assert.equal(getStringWidth('_\u0E34'), 1);
  });

  await t.test('supports control characters', () => {
    assert.equal(getStringWidth(String.fromCodePoint(0)), 0);
    assert.equal(getStringWidth(String.fromCodePoint(31)), 0);
    assert.equal(getStringWidth(String.fromCodePoint(127)), 0);
    assert.equal(getStringWidth(String.fromCodePoint(134)), 0);
    assert.equal(getStringWidth(String.fromCodePoint(159)), 0);
    assert.equal(getStringWidth('\u001B'), 0);
  });

  await t.test('supports combining characters', () => {
    assert.equal(getStringWidth('x\u0300'), 1);
  });

  await t.test('supports emoji characters', () => {
    assert.equal(getStringWidth('👶'), 2);
    assert.equal(getStringWidth('👶🏽'), 2);
    assert.equal(getStringWidth('👩‍👩‍👦‍👦'), 2);
    assert.equal(getStringWidth('👨‍❤️‍💋‍👨'), 2);
    assert.equal(getStringWidth('👶'.repeat(2)), 4);
    assert.equal(getStringWidth('👶🏽'.repeat(2)), 4);
    assert.equal(getStringWidth('👩‍👩‍👦‍👦'.repeat(2)), 4);
    assert.equal(getStringWidth('👨‍❤️‍💋‍👨'.repeat(2)), 4);
  });

  await t.test('supports unicode characters', () => {
    assert.equal(getStringWidth('…'), 1);
    assert.equal(getStringWidth('\u2770'), 1);
    assert.equal(getStringWidth('\u2771'), 1);
    assert.equal(getStringWidth('\u21a9'), 1);
    assert.equal(getStringWidth('\u2193'), 1);
    assert.equal(getStringWidth('\u21F5'), 1);
    assert.equal(getStringWidth('\u2937'), 1);
    assert.equal(getStringWidth('\u27A4'), 1);
    assert.equal(getStringWidth('\u2190'), 1);
    assert.equal(getStringWidth('\u21d0'), 1);
    assert.equal(getStringWidth('\u2194'), 1);
    assert.equal(getStringWidth('\u21d4'), 1);
    assert.equal(getStringWidth('\u21ce'), 1);
    assert.equal(getStringWidth('\u27f7'), 1);
    assert.equal(getStringWidth('\u2192'), 1);
    assert.equal(getStringWidth('\u21d2'), 1);
    assert.equal(getStringWidth('\u21e8'), 1);
    assert.equal(getStringWidth('\u2191'), 1);
    assert.equal(getStringWidth('\u21C5'), 1);
    assert.equal(getStringWidth('\u2197'), 1);
    assert.equal(getStringWidth('\u21cb'), 1);
    assert.equal(getStringWidth('\u21cc'), 1);
    assert.equal(getStringWidth('\u21c6'), 1);
    assert.equal(getStringWidth('\u21c4'), 1);
    assert.equal(getStringWidth('\u2217'), 1);
    assert.equal(getStringWidth('✔'), 1);
    assert.equal(getStringWidth('\u2014'), 1);
    assert.equal(getStringWidth('\u2022'), 1);
    assert.equal(getStringWidth('\u2026'), 1);
    assert.equal(getStringWidth('\u2013'), 1);
    assert.equal(getStringWidth('\u2709'), 1);
    assert.equal(getStringWidth('\u2261'), 1);
    assert.equal(getStringWidth('\u2691'), 1);
    assert.equal(getStringWidth('\u2690'), 1);
    assert.equal(getStringWidth('\u22EF'), 1);
    assert.equal(getStringWidth('\u226A'), 1);
    assert.equal(getStringWidth('\u226B'), 1);
    assert.equal(getStringWidth('\u270E'), 1);
    assert.equal(getStringWidth('\u00a0'), 1);
    assert.equal(getStringWidth('\u2009'), 1);
    assert.equal(getStringWidth('\u200A'), 1);
    assert.equal(getStringWidth('\u274F'), 1);
    assert.equal(getStringWidth('\u2750'), 1);
    assert.equal(getStringWidth('\u26a0'), 1);
    assert.equal(getStringWidth('\u200b'), 0);
  });

  await t.test('supports japanese half-width characters', () => {
    assert.equal(getStringWidth('ﾊﾞ'), 2);
    assert.equal(getStringWidth('ﾊﾟ'), 2);
  });
});

test('string lines', async (t) => {
  await t.test('line count with width of infinity', () => {
    assert.equal(countLines('abc', Infinity), 1);
    assert.equal(countLines('abc\nhi\n', Infinity), 3);
  });

  await t.test('line count with width', () => {
    assert.equal(countLines('lorem ipsum dollor', 10), 2);
    assert.equal(countLines('1234567890', 10), 1);
    assert.equal(countLines('123456789\n0', 5), 3);
    assert.equal(countLines('あいう★あいう★あいう★', 5), 5);
  });
});
