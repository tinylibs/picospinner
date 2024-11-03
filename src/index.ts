import * as constants from './constants';
import {countLines} from './string-lines';
import process from 'node:process';

export type Formatter = (input: string) => string;

export type DisplayOptions = {
  symbolFormatter?: Formatter;
  text?: string;
  symbol?: string;
};

export type Symbols = {
  succeed: string;
  fail: string;
  warn: string;
  info: string;
};

export class Spinner {
  public running = false;

  private text: string = '';
  private currentSymbol: string;
  private symbolFormatter?: Formatter;
  private interval?: Timer;
  private frameIndex = 0;
  private symbols: Symbols;
  private frames: string[];
  private terminalWidth: number = Infinity;
  private lastLinesAmt = 0;
  private framesLineCountCache: number[] = [];

  constructor(display: DisplayOptions | string = '', {frames = constants.DEFAULT_FRAMES, symbols = {} as Partial<Symbols>} = {}) {
    // Merge symbols with defaults
    this.symbols = {...constants.DEFAULT_SYMBOLS, ...symbols};

    if (typeof display === 'string') display = {text: display};
    delete display.symbol;
    this.setDisplay(display, false);

    this.frames = frames;
    this.currentSymbol = frames[0];
    this.framesLineCountCache = new Array(frames.length).fill(-1);
  }

  start(tickMs = constants.DEFAULT_TICK_MS) {
    this.interval = setInterval(this.tick.bind(this), tickMs);
    this.running = true;
    if (process.stdout.getWindowSize) this.terminalWidth = process.stdout.getWindowSize()[0];
    this.currentSymbol = this.frames[0];
    this.framesLineCountCache.fill(-1);
    this.addListeners();
  }

  tick() {
    this.currentSymbol = this.frames[this.frameIndex++];
    if (this.frameIndex === this.frames.length) this.frameIndex = 0;
    this.render();
  }

  private clearMultiLineOutput() {
    for (let i = 0; i < this.lastLinesAmt - 1; i++) {
      process.stdout.write(constants.CLEAR_LINE + constants.UP_LINE);
    }
    process.stdout.write(constants.CLEAR_LINE);
  }

  private onProcessExit = () => {
    if (this.running) {
      this.stop();
    }
  };

  private addListeners() {
    process.once('SIGTERM', this.onProcessExit);
    process.once('SIGINT', this.onProcessExit);
  }

  private clearListeners() {
    process.off('SIGTERM', this.onProcessExit);
    process.off('SIGINT', this.onProcessExit);
  }

  private getLineCount(output: string) {
    let amount = this.framesLineCountCache[this.frameIndex];
    if (amount !== -1) return amount;
    amount = countLines(output, this.terminalWidth);
    this.framesLineCountCache[this.frameIndex] = amount;
    return amount;
  }

  render() {
    let symbol = this.currentSymbol;
    if (this.symbolFormatter) symbol = this.symbolFormatter(symbol);

    this.clearMultiLineOutput();

    const output = (symbol ? symbol + ' ' : '') + this.text;
    this.lastLinesAmt = this.getLineCount(output);

    process.stdout.write(constants.HIDE_CURSOR + output);
  }

  setDisplay(displayOpts: DisplayOptions = {}, render = true) {
    if (typeof displayOpts.symbol === 'string') {
      this.currentSymbol = displayOpts.symbol;
      this.framesLineCountCache.fill(-1);
    }
    if (typeof displayOpts.text === 'string') this.setText(displayOpts.text, false);
    if (displayOpts.symbolFormatter) this.symbolFormatter = displayOpts.symbolFormatter;

    if (render) this.render();
    if (typeof displayOpts.symbol === 'string') this.end();
  }

  setText(text: string, render = true) {
    this.text = text;
    if (this.running) {
      // Clear width cache
      this.framesLineCountCache.fill(-1);
      if (render) this.render();
    }
  }

  succeed(display?: DisplayOptions | string) {
    if (typeof display === 'string') this.setDisplay({text: display, symbol: this.symbols.succeed});
    else this.setDisplay({...display, symbol: this.symbols.succeed});
  }

  fail(display?: DisplayOptions | string) {
    if (typeof display === 'string') this.setDisplay({text: display, symbol: this.symbols.fail});
    else this.setDisplay({...display, symbol: this.symbols.fail});
  }

  warn(display?: DisplayOptions | string) {
    if (typeof display === 'string') this.setDisplay({text: display, symbol: this.symbols.warn});
    else this.setDisplay({...display, symbol: this.symbols.warn});
  }

  info(display?: DisplayOptions | string) {
    if (typeof display === 'string') this.setDisplay({text: display, symbol: this.symbols.info});
    else this.setDisplay({...display, symbol: this.symbols.info});
  }

  stop() {
    this.clearMultiLineOutput();
    this.end(false);
    this.clearListeners();
  }

  private end(newLine = true) {
    clearInterval(this.interval);
    process.stdout.write(constants.SHOW_CURSOR + (newLine ? '\n' : ''));
    this.running = false;
    this.lastLinesAmt = 0;
  }
}
