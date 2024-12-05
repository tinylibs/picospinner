import * as constants from './constants.js';
import {countLines} from './string-lines.js';

export class TextComponent {
  onChange?: () => void;
  onFinish?: () => void;
  finished = false;

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
}

export class Renderer {
  private components: TextComponent[] = [];
  private lastLinesAmt = 0;
  private terminalWidth = Infinity;
  private finishedComponents = 0;

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
    this.clear();

    if (this.components.length === 0) {
      if (this.hideCursor) process.stdout.write(constants.SHOW_CURSOR);
      this.lastLinesAmt = 0;
      return;
    }

    if (this.hideCursor) process.stdout.write(constants.HIDE_CURSOR);

    let output = '';
    let finished = true;
    for (const component of this.components) {
      output += component.output() + '\n';
      if (!component.finished) finished = false;
    }

    this.lastLinesAmt = countLines(output, this.terminalWidth);
    process.stdout.write(output);

    if (finished) {
      this._reset();
      process.stdout.write(constants.SHOW_CURSOR);
    }
  }

  clear() {
    process.stdout.cursorTo(0);
    for (let i = 0; i < this.lastLinesAmt - 1; i++) {
      process.stdout.moveCursor(0, -1);
      if (i > 0) {
        process.stdout.clearLine(1);
      }
    }
  }

  _reset() {
    this.components = [];
    this.lastLinesAmt = 0;
    this.terminalWidth = Infinity;
    this.finishedComponents = 0;
  }
}
