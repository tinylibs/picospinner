import * as constants from './constants';
import {countLines} from './string-lines';

export class TextComponent {
  onChange?: () => void;
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

  constructor(public hideCursor: boolean = true) {}

  addComponent(component: TextComponent) {
    this.components.push(component);
    component.onChange = this.render.bind(this);
    if (process.stdout.getWindowSize) this.terminalWidth = process.stdout.getWindowSize()[0];
    this.render();
  }

  removeComponent(component: TextComponent) {
    this.components = this.components.filter((c) => c !== component);
    component.onChange = undefined;
    this.render();
  }

  render() {
    this.clear();

    if (this.components.length === 0) {
      if (this.hideCursor) process.stdout.write(constants.SHOW_CURSOR);
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
      this.components = [];
      this.lastLinesAmt = 0;
      process.stdout.write(constants.SHOW_CURSOR);
    }
  }

  clear() {
    for (let i = 0; i < this.lastLinesAmt - 1; i++) {
      process.stdout.write(constants.CLEAR_LINE + constants.UP_LINE);
    }
    process.stdout.write(constants.CLEAR_LINE);
  }
}
