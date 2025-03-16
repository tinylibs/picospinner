import capcon from 'capture-console';
import * as constants from '../constants.js';
import {isAbsolute} from 'path';
import {ColorOptions, DisplayOptions, Spinner, SpinnerOptions} from '../index.js';
import * as util from 'node:util';

export function createRenderedOutput(components: {symbol: string; symbolType?: keyof ColorOptions; text: string}[], firstLine = false, prevLines = -1, colors?: ColorOptions | boolean, symbolFormatter?: (v: string) => string, disableNewLineEnding?: boolean) {
  if (colors === true) colors = constants.DEFAULT_COLORS;
  else if (colors) colors = {...constants.DEFAULT_COLORS, ...colors};

  const format = (text: string, componentType: keyof ColorOptions) => {
    if (colors && colors[componentType] && util.styleText) text = util.styleText(colors[componentType], text);
    if (symbolFormatter && componentType !== 'text') return symbolFormatter(text);
    return text;
  };

  let out = (!firstLine && !disableNewLineEnding ? (constants.CLEAR_LINE + constants.UP_LINE).repeat(prevLines === -1 ? components.length : prevLines) : '') + constants.CLEAR_LINE + constants.HIDE_CURSOR;
  for (const component of components) {
    const symbol = component.symbol ? (component.symbolType ? format(component.symbol, component.symbolType) : component.symbol) + ' ' : '';
    out += symbol + format(component.text, 'text') + (!disableNewLineEnding ? '\n' : '');
  }
  return out;
}

export function createRenderedLine(symbol: string, text: string, firstLine: boolean = false, colors?: ColorOptions | boolean, symbolType?: keyof ColorOptions, symbolFormatter?: (v: string) => string, disableNewLineEnding?: boolean) {
  return createRenderedOutput([{symbol, text, symbolType}], firstLine, -1, colors, symbolFormatter, disableNewLineEnding);
}

export function createFinishingRenderedLine(symbol: string, text: string, colors?: ColorOptions | boolean, symbolType?: keyof ColorOptions, symbolFormatter?: (v: string) => string) {
  return createRenderedLine(symbol, text, false, colors, symbolType, symbolFormatter) + constants.SHOW_CURSOR;
}

const isMainCallstack = () => getCallstack().some((call) => call.includes('/dist/') && !call.includes('/test/') && !call.includes('/node_modules/'));

export function suppressStdout() {
  const stdoutWrite = process.stdout.write;
  process.stdout.write = (...args: unknown[]) => {
    if (!isMainCallstack()) return stdoutWrite.call(process.stdout, ...(args as Parameters<typeof stdoutWrite>));
    return true;
  };

  return () => (process.stdout.write = stdoutWrite);
}

export async function interceptStdout(exec: () => Promise<void> | void) {
  let output = '';
  const stdoutWrite = process.stdout.write.bind(process.stdout);

  // @ts-expect-error - types are wrong here for the callback
  capcon.startIntercept(process.stdout, (data: string) => {
    // Since stdout is used to communicate test data, the interceptor should write data that is not from picospinner to stdout
    if (isMainCallstack()) {
      output += data;
    } else stdoutWrite(data);
  });

  await exec();

  capcon.stopIntercept(process.stdout);

  return output;
}

function getCallstack() {
  try {
    throw new Error();
  } catch (err) {
    const stack = (err as Error).stack?.split('\n').slice(2);
    if (!stack) return [];
    return stack.map((call) => {
      let path = call.slice('    at '.length);
      // Remove line and token number ending
      let colonsFound = 0;
      for (let i = path.length - 1; i >= 0; i--) {
        if (path[i] === ':') colonsFound++;
        if (colonsFound === 2) {
          path = path.slice(0, i);
          break;
        }
      }

      // Remove function name
      if (!isAbsolute(path)) {
        for (let i = 0; i < path.length; i++) {
          if (path[i] === '(') {
            path = path.slice(i + 1);
            break;
          }
        }
      }

      return path.replaceAll('\\', '/');
    });
  }
}

export class TickMeasuredSpinner extends Spinner {
  public tickCount = 0;

  constructor(display?: DisplayOptions | string, opts?: SpinnerOptions) {
    super(display, opts);

    const originalTick = this.tick.bind(this);
    this.tick = () => {
      this.tickCount++;
      originalTick();
    };
  }
}
