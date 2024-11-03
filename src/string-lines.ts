import {getStringWidth} from './string-width.js';

export function countLines(str: string, maxWidth: number) {
  const lines = str.split('\n');
  let lineCount = lines.length;
  if (maxWidth === Infinity) return lineCount;

  for (const line of str.split('\n')) {
    lineCount += Math.max(Math.ceil(getStringWidth(line) / maxWidth) - 1, 0);
  }
  return lineCount;
}
