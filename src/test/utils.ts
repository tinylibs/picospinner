import capcon from 'capture-console';
import * as constants from '../constants';
import {isAbsolute} from 'path';

export function createRenderedLine(symbol: string, text: string, firstLine: boolean = false) {
  return (!firstLine ? constants.CLEAR_LINE + constants.UP_LINE : '') + constants.CLEAR_LINE + constants.HIDE_CURSOR + (symbol ? symbol + ' ' : '') + text + '\n';
}

export function createFinishingRenderedLine(symbol: string, text: string) {
  return createRenderedLine(symbol, text) + constants.SHOW_CURSOR;
}

export async function interceptStdout(exec: () => Promise<void> | void) {
  let output = '';
  const stdoutWrite = process.stdout.write.bind(process.stdout);

  // @ts-expect-error - types are wrong here for the callback
  capcon.startIntercept(process.stdout, (data: string) => {
    // Since stdout is used to communicate test data, the interceptor should write data that is not from picospinner to stdout
    if (getCallstack().some((call) => call.includes('/dist/') && !call.includes('/test/') && !call.includes('/node_modules/'))) {
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
