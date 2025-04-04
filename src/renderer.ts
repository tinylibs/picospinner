import * as constants from './constants.js';
import {countLines} from './string-lines.js';

export class TextComponent {
  onChange?: () => void;
  onFinish?: () => void;
  finished = false;
  newLineEnding = true;

  constructor(public text: string) {}

  setText(text: string) {
    this.text = text;
    if (typeof this.onChange === 'function') this.onChange();
  }

  /**
   * Tells the renderer that the component should not be rerendered if it can be avoided
   */
  finish() {
    if (!this.finished && typeof this.onFinish === 'function') this.onFinish();
    this.finished = true;
  }

  output() {
    return this.text;
  }

  disableNewLineEnding() {
    this.newLineEnding = false;
  }
}

export class Renderer {
  private components: TextComponent[] = [];
  private lastLinesAmt = 0;
  private terminalWidth = Infinity;
  private finishedComponents = 0;
  private outputBuffer = '';

  constructor(public hideCursor: boolean = true) {}

  addComponent(component: TextComponent) {
    this.components.push(component);
    component.onChange = this.render.bind(this);
    component.onFinish = this.onComponentFinish.bind(this);

    if (process.stdout.getWindowSize) this.terminalWidth = process.stdout.getWindowSize()[0];
    this.render();
  }

  private onComponentFinish() {
    this.finishedComponents++;
    if (this.finishedComponents === this.components.length) {
      this._reset();
      process.stdout.write(constants.SHOW_CURSOR);
    }
  }

  removeComponent(component: TextComponent) {
    this.components = this.components.filter((c) => c !== component);
    component.onChange = undefined;
    if (component.finished) this.finishedComponents--;
    this.render();
  }

  render() {
    this.outputBuffer = '';
    this.clear();

    if (this.components.length === 0) {
      process.stdout.write(this.outputBuffer);
      if (this.hideCursor) process.stdout.write(constants.SHOW_CURSOR);
      this.lastLinesAmt = 0;
      return;
    }

    if (this.hideCursor) this.outputBuffer += constants.HIDE_CURSOR;

    let output = '';
    let finished = true;
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      output += component.output() + (i !== this.components.length - 1 || component.newLineEnding ? '\n' : '');
      if (!component.finished) finished = false;
    }

    this.lastLinesAmt = countLines(output, this.terminalWidth);
    this.outputBuffer += output;

    if (finished) {
      this._reset();
      this.outputBuffer += constants.SHOW_CURSOR;
    }

    process.stdout.write(this.outputBuffer);
  }

  clear() {
    for (let i = 0; i < this.lastLinesAmt - 1; i++) {
      this.outputBuffer += constants.CLEAR_LINE + constants.UP_LINE;
    }
    this.outputBuffer += constants.CLEAR_LINE;
  }

  _reset() {
    this.components = [];
    this.lastLinesAmt = 0;
    this.terminalWidth = Infinity;
    this.finishedComponents = 0;
  }
}
