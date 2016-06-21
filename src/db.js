import Promise from 'bluebird'
import Database from 'warehouse'
import { ensureFile } from './fileUtils'

const debug = require('debug')('db')

export default class DB {
  constructor(dbPath) {
    debug('dbPath: %s', dbPath)
    this.dbPath = dbPath
    this.models = {}
  }

  get() {
    if (this.db) {
      return Promise.resolve(this.db)
    }

    const path = this.dbPath
    return ensureFile(path).then(() => {
      this.db = new Database({ path })
      return this.db.load()
    }).then(() => this.db)
  }

  save() {
    return this.get().then(db => db.save())
  }

  model(name, schema) {
    return this.get().then(db => (
      db.model(name, schema)
    ))
  }
}
