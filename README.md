# picospinner

<img src="https://raw.githubusercontent.com/PondWader/picospinner/main/assets/demo.gif" width="522" alt="Demo">

A lightweight, no dependency, pluggable CLI spinner library.

## Install

```
npm i picospinner
```

## Usage

### Basic

```js
import {Spinner} from 'picospinner';

const spinner = new Spinner('Loading...', {colors: true});
spinner.start();
setTimeout(() => {
  spinner.succeed('Finished.');
}, 5000);
```

### Custom symbols

```js
import {Spinner} from 'picospinner';

const spinner = new Spinner('Loading...', {
  symbols: {
    warn: '⚠'
  },
  colors: true
});
spinner.start();
setTimeout(() => {
  spinner.warn("Something didn't go quite right.");
}, 5000);
```

### Custom frames

```js
import {Spinner} from 'picospinner';

const spinner = new Spinner('Loading...', {
  frames: ['-', '\\', '|', '/']
});
spinner.start();
setTimeout(() => {
  spinner.info('Finished.');
}, 5000);
```

### Removing the spinner

Calling `spinner.stop();` will stop the spinner and remove it.

### Colours

As of version **2.1.0** colours can be easily applied with the `colors` option which uses the [`styleText`](https://nodejs.org/api/util.html#utilstyletextformat-text-options) function from [`node:util`](https://nodejs.org/api/util.html) if it is available (Node versions greater than **22.0.0**, **21.7.0** or **20.12.0**). If it's not available, no colours will be displayed.

The option accepts a boolean value controlling whether or not to display the default colours or it can be passed an object defining styles for each component type as shown below:

```js
// Create spinner with default colours
const spinner = new Spinner('Loading...', {
  colors: true
});

// Create spinner with custom colours
const spinner = new Spinner('Loading...', {
  colors: {
    text: 'gray',
    succeed: ['bold', 'green'],
    spinner: 'magenta'
    // The other properties (fail, warn, info) will use the default colours since they're not specified in this example
  }
});
```

Alternatively, colours can be displayed by using a third-party formatter such as picocolors or chalk. First install picocolors:

```
npm i picocolors
```

Text can be formatted by passing pre-formatted text:

```js
import {Spinner} from 'picospinner';
import pc from 'picocolors';

const spinner = new Spinner(pc.blue('Loading...'));
spinner.start();
setTimeout(() => spinner.setText(pc.magenta("Now it's magenta!")), 1000);
```

Symbols can be formatted by passing a symbol formatter.

```js
import {Spinner} from 'picospinner';
import pc from 'picocolors';

const spinner = new Spinner({
  text: pc.blue('Loading...'),
  symbolFormatter: pc.green
});
spinner.start();
spinner.fail({
  text: 'Disaster!',
  symbolFormatter: pc.red
});
```

### Custom rotation speed

A custom tick speed (how often the spinner rotates) in milliseconds can be passed to `spinner.start`:

```js
import {Spinner} from 'picospinner';

const spinner = new Spinner();
spinner.start(10);
```
