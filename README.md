# picospinner

<img src="https://raw.githubusercontent.com/PondWader/picospinner/main/assets/demo.gif" width="522" alt="Demo">

A lightweight, no dependency, pluggable CLI spinner library.

## Install

```
npm i picospinner
```

#### ESM & CommonJS

As of version 3, this package is published exclusively as an [ES module](https://nodejs.org/api/esm.html#modules-ecmascript-modules). Recent Node.js versions (v20.17.0+) support [`require(esm)`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require) in [CommonJS](https://nodejs.org/api/modules.html#modules-commonjs-modules). If a version with CommonJS syntax is required version 2 of this package can be installed with `npm i picospinner@2`. Version 2 will continue to be maintained in the [v2](https://github.com/tinylibs/picospinner/tree/v2) branch for the foreseeable future but will not receive new features.

## Usage

### Basic

```js
import {Spinner} from 'picospinner';

const spinner = new Spinner('Loading...');
spinner.start();
setTimeout(() => {
  // Spinner can be ended with one of: succeed, fail, warn, info or stop
  spinner.succeed('Finished.');
}, 5000);
```

### Custom symbols

```js
import {Spinner} from 'picospinner';

const spinner = new Spinner('Loading...', {
  symbols: {
    warn: '⚠'
  }
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

As of version **3.0.0** colours are enabled by default. This feature uses the [`styleText`](https://nodejs.org/api/util.html#utilstyletextformat-text-options) function from [`node:util`](https://nodejs.org/api/util.html) if it is available (Node versions greater than **22.0.0**, **21.7.0** or **20.12.0**). If it's not available, no colours will be displayed.

The `colors` option can be passed to disable colours or customise the colours. The option accepts a boolean value controlling whether or not to display the default colours or it can be passed an object defining styles for each component type as shown below:

```js
// Create spinner with no colours
const spinner = new Spinner('Loading...', {colors: false});

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
