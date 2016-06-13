import path from 'path'
import Promise from 'bluebird'
import Database from 'warehouse'
import { searchFile, ensureFile } from './fileUtils'
import { APP_CONFIG_NAME, APP_DB_NAME } from './config'

const debug = require('debug')('db')

// Database object
let db = null

// Model objects
const models = {}

function get() {
  if (db) {
    return Promise.resolve(db)
  }

  return searchFile(APP_CONFIG_NAME).then(configPath => {
    if (!configPath) {
      return Promise.reject('Please run `evermark init [destination]` first')
    }

    const noteDir = path.dirname(configPath)
    const dbPath = `${noteDir}/${APP_DB_NAME}`
    debug('dbPath: %s', dbPath)

    return ensureFile(dbPath).then(() => {
      db = new Database({ path: dbPath })
      return db.load()
    }).then(() => db)
  })
}

function save() {
  return get().then(dbs => dbs.save())
}

function model(name, schema) {
  if (models[name]) {
    return Promise.resolve(models[name])
  }

  return get().then(dbs => {
    models[name] = dbs.model(name, schema)
    return models[name]
  })
}

export default {
  get,
  save,
  model,
}
