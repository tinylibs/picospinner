import * as constants from './constants.js';
import {Renderer, TextComponent} from './renderer.js';

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

  constructor(display: DisplayOptions | string = '', {frames = constants.DEFAULT_FRAMES, symbols = {} as Partial<Symbols>} = {}) {
    // Merge symbols with defaults
    this.symbols = {...constants.DEFAULT_SYMBOLS, ...symbols};

    if (typeof display === 'string') display = {text: display};
    delete display.symbol;
    this.setDisplay(display, false);

    this.frames = frames;
    this.currentSymbol = frames[0];
  }

  start(tickMs = constants.DEFAULT_TICK_MS) {
    if (this.running) throw new Error('Spinner is already running.');

    this.interval = setInterval(this.tick.bind(this), tickMs);
    this.running = true;
    this.currentSymbol = this.frames[0];

    this.tick();
    renderer.addComponent(this.component);
  }

  tick() {
    this.currentSymbol = this.frames[this.frameIndex++];
    if (this.frameIndex === this.frames.length) this.frameIndex = 0;
    this.refresh();
  }

  refresh() {
    let symbol = this.currentSymbol;
    if (this.symbolFormatter) symbol = this.symbolFormatter(symbol);
    const output = (symbol ? symbol + ' ' : '') + this.text;

    this.component.setText(output);
  }

  setDisplay(displayOpts: DisplayOptions = {}, render = true) {
    if (typeof displayOpts.symbol === 'string') {
      this.currentSymbol = displayOpts.symbol;
    }
    if (typeof displayOpts.text === 'string') this.setText(displayOpts.text, false);
    if (displayOpts.symbolFormatter) this.symbolFormatter = displayOpts.symbolFormatter;

    if (render) this.refresh();
    if (typeof displayOpts.symbol === 'string') this.end();
  }

  setText(text: string, render = true) {
    this.text = text;
    if (this.running) {
      // Clear width cache
      if (render) this.refresh();
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
    this.end(false);
  }

  private end(keepComponent = true) {
    clearInterval(this.interval);
    if (keepComponent) this.component.finish();
    else renderer.removeComponent(this.component);
    this.running = false;
  }
}
