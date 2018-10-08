const Database = require('warehouse')
const debug = require('debug')('db')
const fileUtils = require('./fileUtils')

class Db {
  constructor(dbPath) {
    debug('dbPath: %s', dbPath)
    this.dbPath = dbPath
  }

  get() {
    if (!this.db) {
      const path = this.dbPath
      this.db = fileUtils.ensureFile(path).then(() => {
        const db = new Database({ path })
        return db.load().then(() => db)
      })
    }
    return this.db
  }

  save() {
    return this.get().then(db => db.save())
  }

  model(name, schema) {
    return this.get().then(db => db.model(name, schema))
  }
}

module.exports = Db
