import os from 'os';

// @ts-ignore
import {LEVEL, MESSAGE, SPLAT} from 'triple-beam';
import Transport from 'winston-transport';

import {LooseObject} from 'etc/types';


/**
 * Console transport for Winston that splits incoming messages on the platform
 * specific newline character and issues separate calls to the target logging
 * function for each line.
 *
 * See: https://github.com/winstonjs/winston/blob/master/lib/winston/transports/console.js
 */
export default class MultiLineConsoleTransport extends Transport {
  /**
   * Formatting function provided to our constructor.
   */
  private readonly _format: LooseObject;


  /**
   * Log levels to write to stderr instead of stdout.
   */
  private readonly _stderrLevels: LooseObject;


  /**
   * OS-specific end-of-line character to use.
   */
  private readonly _eol: string;


  /**
   * Constructor for the CustomConsole transport object responsible for
   * persisting log messages and metadata to a terminal or TTY.
   */
  constructor(options: any = {}) {
    // In order to prevent the super class from formatting messages before we
    // receive them, we must remove the 'format' param from our options object
    // before making the super call. We save a reference to it, however, so we
    // can use it ourselves later on.
    const _format = options.format;
    Reflect.deleteProperty(options, 'format');

    super(options);

    this._format = _format;
    this._stderrLevels = this._stringArrayToSet(options.stderrLevels);
    this._eol = options.eol || os.EOL;
  }


  /**
   * Returns a Set-like object with strArray's elements as keys (each with the
   * value true).
   */
  private _stringArrayToSet(strArray: Array<any>, errMsg?: string): object {
    if (!strArray) {
      return {};
    }

    const err = new TypeError(errMsg || 'Cannot make set from type other than Array of string elements.');

    if (!Array.isArray(strArray)) {
      throw err;
    }

    return strArray.reduce((set, el) => {
      if (typeof el !== 'string') {
        throw err;
      }

      set[el] = true;

      return set;
    }, {} as any);
  }


  /**
   * Provided an array of arguments passed to a logging function, returns a new
   * array of log "lines", each of which should be invoked with a separate call
   * to the original logging function. This facilitates properly-intented
   * multi-line logging, which the Winston maintainers refuse to implement
   * themselves.
   *
   * See: https://github.com/winstonjs/winston/issues/429
   */
  private _parseLogArguments(...messages: Array<any>): Array<string> {
    return messages.join('').split(this._eol).map((message: any) => {
      // Messages should already be of type string, but cast them as strings
      // anyway so we can safely call trim() on them.
      return String(message).trim();
    });
  }


  /**
   * Original log method from Winston's Console transport, but made synchronous.
   * Asynchronicity is now handled by the public log method.
   */
  private _log(info: LooseObject) {
    if (this._stderrLevels[info[LEVEL]]) {
      if (Reflect.has(console, '_stderr')) {
        Reflect.get(console, '_stderr').write(`${info[MESSAGE]}${this._eol}`);
      } else {
        console.error(info[MESSAGE]);
      }

      return;
    }

    if (Reflect.has(console, '_stdout')) {
      Reflect.get(console, '_stdout').write(`${info[MESSAGE]}${this._eol}`);
    } else {
      console.log(info[MESSAGE]);
    }
  }


  /**
   * Method that replaces the original Console transport's log method to
   * facilitate correctly logging multi-line messages.
   */
  public log(info: LooseObject, callback: Function): void {
    setImmediate(() => this.emit('logged', info));

    // The raw first line is at the 'message' key. the Symbol(message) key
    // contains a serialized info object that we would have to parse.
    const firstArgument = info.message;

    // The remainder of the arguments are stored at Symbol(splat).
    const restArguments = info[SPLAT] || [];

    // Parse the complete list of arguments into an array where each element
    // represents a line.
    const lines = this._parseLogArguments([].concat(firstArgument).concat(restArguments));

    lines.forEach((curLine: string) => {
      // Format each line individually using the formatter we were configured
      // with.
      const transformedInfo = this._format.transform({
        [MESSAGE]: curLine,
        message: curLine,
        [LEVEL]: info[LEVEL],
        level: info[LEVEL]
      }, this._format.options);

      // Pass each formatted info object to the original(ish) log method.
      this._log(transformedInfo);
    });

    callback(null, true);
  }
}


// Set a name on the prototype. This is a Winston convention.
Reflect.set(MultiLineConsoleTransport.prototype, 'name', 'custom-console');
