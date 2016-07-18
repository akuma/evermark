import path from 'path'
import Promise from 'bluebird'
import fileUtils from './fileUtils'
import EvermarkError from './EvermarkError'

const debug = require('debug')('config')

export const APP_NAME = 'Evermark'
export const APP_DB_NAME = 'evermark.db'
export const APP_CONFIG_NAME = 'evermark.json'

function getConfigPath(workDir = `.${path.sep}`) {
  return fileUtils.searchFile(APP_CONFIG_NAME, workDir)
    .then(configPath => {
      debug('configPath: %s', configPath)
      if (!configPath) {
        throw new EvermarkError(
          'Please run `evermark init [destination]` to init a new Evermark folder')
      }
      return configPath
    })
}

function getDbPath(workDir) {
  return getConfigPath(workDir)
    .then(configPath => {
      const dbDir = path.dirname(configPath)
      return path.join(dbDir, APP_DB_NAME)
    })
}

function readConfig(workDir) {
  return getConfigPath(workDir)
    .then(configPath => [configPath, fileUtils.readFile(configPath)])
    .spread((configPath, configStr) => {
      let config = null
      try {
        config = JSON.parse(configStr)
      } catch (e) {
        throw new EvermarkError(
          `Please write to ${configPath}:\n\n` +
          `{\n  "token": "xxx",\n  "china": xxx\n}`, e)
      }

      if (!config.token) {
        throw new EvermarkError(`Please write developer token to ${configPath}\n\n` +
          'To get a developer token, please visit:\n  ' +
          'https://www.evernote.com/api/DeveloperToken.action or ' +
          'https://app.yinxiang.com/api/DeveloperToken.action')
      }

      debug('config: %o', config)
      return config
    })
}

function getConfig(name, workDir) {
  return readConfig(workDir).then(config => config[name])
}

function setConfig(name, value, workDir) {
  return readConfig(workDir)
    .then(config => {
      const conf = config
      if (value === 'true') {
        conf[name] = true
      } else if (value === 'false') {
        conf[name] = false
      } else {
        conf[name] = value
      }
      return [getConfigPath(workDir), conf]
    })
    .spread((configPath, config) => saveConfig(configPath, config))
}

function initConfig(destination = '.') {
  const dest = destination.endsWith(path.sep) ? destination : `${destination}${path.sep}`
  const config = {
    token: 'Your developer token',
    china: true,
    sandbox: false,
    highlight: 'github',
  }
  return saveConfig(`${dest}${APP_CONFIG_NAME}`, config)
}

function saveConfig(file, config) {
  debug('file: %s', file)
  debug('config: %o', config)

  let configStr
  try {
    // Beautify json string and save to config file
    configStr = JSON.stringify(config, null, 2)
  } catch (e) {
    return Promise.reject(e)
  }

  return fileUtils.writeFile(file, configStr).then(() => configStr)
}

export default {
  getConfigPath,
  getDbPath,
  readConfig,
  getConfig,
  setConfig,
  initConfig,
}
