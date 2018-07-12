import os from 'os';

import {LooseObject} from 'etc/types';
// @ts-ignore
import {LEVEL, MESSAGE, SPLAT} from 'triple-beam';
import MultiLineConsoleTransport from './index';


function buildInfoObject(level: string, ...args: Array<any>): LooseObject {
  const [firstArg, ...restArgs] = args;

  const infoObj = {
    level,
    [LEVEL]: level,
    message: firstArg,
    [SPLAT]: restArgs
  };

  infoObj[MESSAGE] = JSON.stringify(infoObj);

  return infoObj;
}


const formatterMock = {
  transform: jest.fn(arg => arg)
};


describe('multi-line console transport', () => {
  let transport: MultiLineConsoleTransport;

  it('should emit the "logged" event', done => {
    transport = new MultiLineConsoleTransport({
      format: formatterMock
    });

    const infoObj = buildInfoObject('warn', 'oh noes!');

    transport.on('logged', _info => {
      expect(_info).toBe(infoObj);
      done();
    });

    transport.log(infoObj, jest.fn());
  });

  describe('when the log level is in stderrLevels', () => {
    const ERR_LEVEL = 'error';
    const ERR_MESSAGE = 'oh noes!';

    describe('and "console._stderr" exists', () => {
      it('should write to "console._stderr', () => {
        if (!Reflect.get(global.console, '_stderr')) {
          Reflect.set(global.console, '_stderr', {
            write: jest.fn()
          });
        } else {
          jest.spyOn(Reflect.get(global.console, '_stderr'), 'write');
        }

        transport = new MultiLineConsoleTransport({format: formatterMock, stderrLevels: [ERR_LEVEL]});
        transport.log(buildInfoObject(ERR_LEVEL, ERR_MESSAGE), jest.fn());
        expect(Reflect.get(global.console, '_stderr').write).toHaveBeenCalledWith(`${ERR_MESSAGE}${os.EOL}`);
      });
    });

    describe('when "console._stderr" does not exist', () => {
      it('should write to "console.error"', () => {
        const ORIG_STDERR = Reflect.get(global.console, '_stderr');
        Reflect.deleteProperty(global.console, '_stderr');

        const ORIG_ERR = global.console.error;
        Reflect.set(global.console, 'error', jest.fn());

        transport = new MultiLineConsoleTransport({format: formatterMock, stderrLevels: [ERR_LEVEL]});
        transport.log(buildInfoObject(ERR_LEVEL, ERR_MESSAGE), jest.fn());
        expect(console.error).toHaveBeenCalledWith(ERR_MESSAGE);

        Reflect.set(global.console, '_stderr', ORIG_STDERR);
        Reflect.set(global.console, 'error', ORIG_ERR);
      });
    });
  });

  describe('when the log level is not in stderrLevels', () => {
    const LOG_LEVEL = 'info';
    const LOG_MESSAGE = 'hello, thar!';

    describe('and "console._stdout" exists', () => {
      it('should write to "console._stdout', () => {
        if (!Reflect.get(global.console, '_stdout')) {
          Reflect.set(global.console, '_stdout', {
            write: jest.fn()
          });
        } else {
          jest.spyOn(Reflect.get(global.console, '_stdout'), 'write');
        }

        transport = new MultiLineConsoleTransport({format: formatterMock});
        transport.log(buildInfoObject(LOG_LEVEL, LOG_MESSAGE), jest.fn());
        expect(Reflect.get(global.console, '_stdout').write).toHaveBeenCalledWith(`${LOG_MESSAGE}${os.EOL}`);
      });
    });

    describe('when "console._stdout" does not exist', () => {
      it('should write to "console.log"', () => {
        const ORIG_STDOUT = Reflect.get(global.console, '_stdout');
        Reflect.deleteProperty(global.console, '_stdout');

        const ORIG_LOG = Reflect.get(global.console, 'log');
        Reflect.set(global.console, 'log', jest.fn());

        transport = new MultiLineConsoleTransport({format: formatterMock});
        transport.log(buildInfoObject(LOG_LEVEL, LOG_MESSAGE), jest.fn());
        expect(console.log).toHaveBeenCalledWith(LOG_MESSAGE);

        Reflect.set(global.console, '_stdout', ORIG_STDOUT);
        Reflect.set(global.console, 'log', ORIG_LOG);
      });
    });
  });

  describe('when passed an invaid "stderrLevels', () => {
    expect(() => {
      transport = new MultiLineConsoleTransport({stderrLevels: 'foo'});
    }).toThrow('Cannot make set from type other than Array of string elements.');

    expect(() => {
      transport = new MultiLineConsoleTransport({stderrLevels: [null]});
    }).toThrow('Cannot make set from type other than Array of string elements.');
  });
});
