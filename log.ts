
import * as path from 'path'
import {isEmpty}  from 'lodash'
import { createLogger, transports, format } from 'winston';
import { settings } from './settings';

const errorLog = path.format({
  dir: settings.logsPath,
  base: settings.errorLog
})
const infoLog = path.format({
  dir: settings.logsPath,
  base: settings.infoLog
})

const logOutput = format.printf( ({ level, message, timestamp , ...metadata}) => {
  let msg = `${timestamp} [${level}] : ${message} `  
  if(!isEmpty(metadata)) {
	  msg += JSON.stringify(metadata)
  }
  return msg
});

const customFormat = format.combine(
  format.splat(),
  format.timestamp({
    format: 'YYYY-MM-DDTHH:mm:ss.SSS'
  }),
  logOutput
);

const logger = createLogger({
  level: settings.level,
  format: customFormat,
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `stdout.log`
    //
    new transports.File({ filename: errorLog, level: 'error' }),
    new transports.File({ filename: infoLog }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (settings.level === 'debug') {
  logger.add(new transports.Console({
    format: customFormat,
  }));
}

export default logger