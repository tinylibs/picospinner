import {Symbols} from './index.js';

export const DEFAULT_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
export const DEFAULT_TICK_MS = 50;
export const HIDE_CURSOR = '\u001B[?25l';
export const SHOW_CURSOR = '\u001B[?25h';
export const CLEAR_LINE = '\r\x1b[K';
export const UP_LINE = '\u001B[1A';
export const DEFAULT_SYMBOLS: Symbols = {
  succeed: '✔',
  fail: '✖',
  warn: '!',
  info: 'ℹ'
};
