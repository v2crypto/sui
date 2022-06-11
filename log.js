import fs from 'fs'
import path from 'path'
import * as tracer from 'tracer'

const setting = {
  level: 'debug', // debug or info
  logsPath: './logs',
  errorLog: 'error.log',
  infoLog: 'app.log',
}

const errorLog = path.format({
  dir: setting.logsPath,
  base: setting.errorLog
})
const infoLog = path.format({
  dir: setting.logsPath,
  base: setting.infoLog
})

export const logger = tracer.colorConsole({
  level: setting.level,
  format: '{{timestamp}} [{{title}}] {{file}}:{{line}} {{message}} ',
  dateformat: 'yyyy-mm-dd" "HH:MM:ss.LL.Z',
  transport: [
    // records to log
    function(data) {
      let f
      if (data.title === 'error')
        f = errorLog
      else
        f = infoLog
      fs.createWriteStream(f, {
        flags: 'a',
        encoding: 'utf8',
        mode: '0666'
      })
        .write(data.rawoutput + '\n')
    },
    // to console
    function (data) {
      console.log(data.output)
    },
  ]
})
