import test from 'ava'
import Database from 'warehouse'
import Model from 'warehouse/lib/model'
import db from '../src/db'

test('should get db', async t => {
  const dbs = await db.get()
  t.true(dbs instanceof Database)
})

test('should get model', async t => {
  const model = await db.model('foo', {
    name: String,
    created: { type: Date, default: Date.now },
  })
  t.true(model instanceof Model)
})
