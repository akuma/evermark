import path from 'path'
import fileUtils from './fileUtils'

const debug = require('debug')('config')

export const APP_NAME = 'Evermark'
export const APP_DB_NAME = 'evermark.db'
export const APP_CONFIG_NAME = 'evermark.json'

export function* getConfigPath(dir = './') {
  const configPath = yield fileUtils.searchFile(APP_CONFIG_NAME, dir)
  debug('configPath: %s', configPath)
  if (!configPath) {
    throw new Error('Please run `evermark init [destination]` to init a new Evermark folder')
  }
  return configPath
}

export function* getDbPath(workDir) {
  const configPath = yield getConfigPath(workDir)
  const dbDir = path.dirname(configPath)
  return `${dbDir}/${APP_DB_NAME}`
}

export function* readConfig(workDir) {
  const configPath = yield getConfigPath(workDir)

  let config = null
  try {
    const configStr = yield fileUtils.readFile(configPath)
    config = JSON.parse(configStr)
  } catch (e) {
    throw new Error(`Please write to ${configPath}:\n\n{\n  "token": "xxx",\n  "china": xxx\n}`, e)
  }

  if (!config.token) {
    throw new Error(`Please write developer token to ${configPath}\n\n` +
      'To get a developer token, please visit:\n  ' +
      'https://www.evernote.com/api/DeveloperToken.action or ' +
      'https://app.yinxiang.com/api/DeveloperToken.action')
  }

  debug('config: %o', config)
  return config
}

export function* getConfig(name, workDir) {
  const config = yield readConfig(workDir)
  return config[name]
}

export function* setConfig(name, value, workDir) {
  const config = yield readConfig(workDir)

  if (value === 'true') {
    config[name] = true
  } else if (value === 'false') {
    config[name] = false
  } else {
    config[name] = value
  }

  const configPath = yield getConfigPath(workDir)
  return yield saveConfig(configPath, config)
}

export function* initConfig(destination = '.') {
  const dest = destination.endsWith('/') ? destination : `${destination}/`
  const config = { token: 'Your developer token', china: true }
  return yield saveConfig(`${dest}${APP_CONFIG_NAME}`, config)
}

function* saveConfig(file, config) {
  debug('file: %s', file)
  debug('config: %o', config)

  try {
    // Beautify json string and save to config file
    const configStr = JSON.stringify(config, null, 2)
    yield fileUtils.writeFile(file, configStr)
    return configStr
  } catch (e) {
    throw new Error(e)
  }
}
