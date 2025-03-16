import * as constants from './constants.js';
import {Renderer, TextComponent} from './renderer.js';
import * as util from 'node:util';

export type Formatter = (input: string) => string;

export type DisplayOptions = {
  symbolFormatter?: Formatter;
  text?: string;
  symbol?: string;
  symbolType?: 'succeed' | 'fail' | 'warn' | 'info' | 'spinner';
};

export type SpinnerOptions = {
  colors?: boolean | ColorOptions;
  frames?: string[];
  symbols?: Partial<Symbols>;
  disableNewLineEnding?: boolean;
};

type Style = Parameters<typeof util.styleText>[0];

export type ColorOptions = {
  succeed?: Style;
  fail?: Style;
  warn?: Style;
  info?: Style;
  spinner?: Style;
  text?: Style;
};

export type Symbols = {
  succeed: string;
  fail: string;
  warn: string;
  info: string;
};

// Global renderer so that multiple spinners can run at the same time
export const renderer = new Renderer();

export class Spinner {
  public running = false;

  private text: string = '';
  private currentSymbol: string;
  private symbolFormatter?: Formatter;
  private interval?: Timer;
  private frameIndex = 0;
  private symbols: Symbols;
  private frames: string[];
  private component = new TextComponent('');
  private colors?: ColorOptions;

  constructor(display: DisplayOptions | string = '', {disableNewLineEnding, colors, frames = constants.DEFAULT_FRAMES, symbols = {} as Partial<Symbols>}: SpinnerOptions = {}) {
    // Merge symbols with defaults
    this.symbols = {...constants.DEFAULT_SYMBOLS, ...symbols};

    // Setup colors if the option is passed
    if (colors === true) this.colors = constants.DEFAULT_COLORS;
    else if (typeof colors === 'object') {
      this.colors = {
        ...constants.DEFAULT_COLORS,
        ...colors
      };
    }

    if (disableNewLineEnding === true) this.component.disableNewLineEnding();

    if (typeof display === 'string') display = {text: display};
    delete display.symbol;
    this.setDisplay(display, false);

    this.frames = frames;
    this.currentSymbol = frames[0];
  }

  start(tickMs = constants.DEFAULT_TICK_MS) {
    if (this.running) throw new Error('Spinner is already running.');
    if (this.component.finished) this.component.finished = false;

    this.interval = setInterval(this.tick.bind(this), tickMs);
    this.running = true;
    this.currentSymbol = this.frames[0];

    this.tick();
    renderer.addComponent(this.component);
    this.addListeners();
  }

  tick() {
    this.currentSymbol = this.format(this.frames[this.frameIndex++], 'spinner');
    if (this.frameIndex === this.frames.length) this.frameIndex = 0;
    this.refresh();
  }

  private onProcessExit = (signal?: string | number) => {
    this.stop();
    // SIGTERM is 15, SIGINT is 2
    let signalCode;
    if (signal === 'SIGTERM') {
      signalCode = 15 + 128;
    } else if (signal === 'SIGINT') {
      signalCode = 2 + 128;
    } else {
      signalCode = Number(signal);
    }
    process.exit(signalCode);
  };

  private addListeners() {
    process.once('SIGTERM', this.onProcessExit);
    process.once('SIGINT', this.onProcessExit);
    process.once('exit', this.onProcessExit);
  }

  private clearListeners() {
    process.off('SIGTERM', this.onProcessExit);
    process.off('SIGINT', this.onProcessExit);
    process.off('exit', this.onProcessExit);
  }

  refresh() {
    let symbol = this.currentSymbol;
    if (this.symbolFormatter) symbol = this.symbolFormatter(symbol);
    const output = (symbol ? symbol + ' ' : '') + this.text;

    this.component.setText(output);
  }

  setDisplay(displayOpts: DisplayOptions = {}, render = true) {
    if (typeof displayOpts.symbol === 'string') {
      if (typeof displayOpts.symbolType === 'string') {
        this.currentSymbol = this.format(displayOpts.symbol, displayOpts.symbolType);
      } else this.currentSymbol = displayOpts.symbol;
    }
    if (typeof displayOpts.text === 'string') this.setText(displayOpts.text, false);
    if (displayOpts.symbolFormatter) this.symbolFormatter = displayOpts.symbolFormatter;

    if (render) this.refresh();
    if (typeof displayOpts.symbol === 'string') this.end();
  }

  setText(text: string, render = true) {
    this.text = this.format(text, 'text');
    if (this.running) {
      if (render) this.refresh();
    }
  }

  succeed(display?: DisplayOptions | string) {
    if (typeof display === 'string') this.setDisplay({text: display, symbol: this.symbols.succeed, symbolType: 'succeed'});
    else this.setDisplay({...display, symbol: this.symbols.succeed, symbolType: 'succeed'});
  }

  fail(display?: DisplayOptions | string) {
    if (typeof display === 'string') this.setDisplay({text: display, symbol: this.symbols.fail, symbolType: 'fail'});
    else this.setDisplay({...display, symbol: this.symbols.fail, symbolType: 'fail'});
  }

  warn(display?: DisplayOptions | string) {
    if (typeof display === 'string') this.setDisplay({text: display, symbol: this.symbols.warn, symbolType: 'warn'});
    else this.setDisplay({...display, symbol: this.symbols.warn, symbolType: 'warn'});
  }

  info(display?: DisplayOptions | string) {
    if (typeof display === 'string') this.setDisplay({text: display, symbol: this.symbols.info, symbolType: 'info'});
    else this.setDisplay({...display, symbol: this.symbols.info, symbolType: 'info'});
  }

  stop() {
    this.end(false);
  }

  private end(keepComponent = true) {
    clearInterval(this.interval);
    this.clearListeners();
    if (keepComponent) this.component.finish();
    else renderer.removeComponent(this.component);
    this.running = false;
  }

  private format(component: string, componentName: keyof ColorOptions): string {
    if (this.colors === undefined) return component;

    const color = this.colors[componentName];
    // Ensure that the Node version contains util.styleText
    if (color && util.styleText !== undefined) {
      return util.styleText(color, component);
    }
    return component;
  }
}
