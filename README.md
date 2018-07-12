# Winston Multi-Line Console Transport

Let's say we wanted to log something like this to Winston:

```js
logger.debug('This is a multi-line:\nlog message.');
```

By default, we would get output like this:

```
debug: This is a multi-line:
log message.
```

Lines 2-N will not be aligned correctly, making things harder to read. This can be especially obnoxious when logging stack traces or serialized JSON structures.

Using this package instead of the built-in Console transport gives you output like this:

```
debug: This is a multi-line:
debug: log message.
```

## Install

**Note:** This package requires Winston 3.x.

```bash
$ npm i @collectivehealth/winston-multi-line-console-transport
```

## Use

```js
import winston from 'winston';
import MultiLineConsoleTransport from '@collectivehealth/winston-multi-line-console-transport';


const logger = winston.createLogger({
  // Logger options.
});


logger.add(new MultiLineConsoleTransport({
  level: 'debug'
  format: winston.format.combine(
    winston.format.prettyPrint(),
    winston.format.colorize(),
    winston.format.simple()
  )
}));
```
