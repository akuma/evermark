import test from 'ava'
import Database from 'warehouse'
import Model from 'warehouse/lib/model'
import Document from 'warehouse/lib/document'
import DB from '../src/db'
import fileUtils from '../src/fileUtils'

const fixturesDir = `${__dirname}/fixtures`
const testDir = `${__dirname}/db-test`
const dbPath = `${testDir}/evermark.db`
const db = new DB(dbPath)

test.before(async () => {
  await fileUtils.remove(testDir)
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
})

test.after(async () => {
  await fileUtils.remove(testDir)
})

test('should get db', async t => {
  const dbo = await db.get()
  t.true(dbo instanceof Database)
})

test('should get model', async t => {
  const Test = await db.model('Test', {
    name: { type: String, required: true },
  })
  t.true(Test instanceof Model)
})

test('should save', async t => {
  const Test = await db.model('Test', {
    name: { type: String, required: true },
  })

  await Test.insert({ name: 'foo' })
  await Test.insert({ name: 'bar' })
  await db.save()

  const inserted = Test.findOne({ name: 'foo' })
  t.true(inserted instanceof Document)
  t.is(inserted.name, 'foo')

  let data = await fileUtils.readFile(dbPath)
  let json = JSON.parse(data)
  t.is(json.models.Test.length, 2)
  t.is(json.models.Test[0].name, 'foo')
  t.is(json.models.Test[1].name, 'bar')

  await Test.remove({ name: 'foo' })
  await Test.remove({ name: 'bar' })
  await db.save()

  data = await fileUtils.readFile(dbPath)
  json = JSON.parse(data)
  t.deepEqual(json.models.Test, [])

  Test.destroy()
})
