const path = require('path')
const test = require('ava')
const Database = require('warehouse')
const Model = require('warehouse/lib/model')
const Document = require('warehouse/lib/document')
const Db = require('../src/db')
const fileUtils = require('../src/fileUtils')

const fixturesDir = path.join(__dirname, 'fixtures')
const testDir = path.join(__dirname, 'db-test')
const dbPath = path.join(testDir, 'evermark.db')
const db = new Db(dbPath)

test.before(async () => {
  await fileUtils.remove(testDir)
  await fileUtils.copy(fixturesDir, testDir)
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
    name: { type: String, required: true }
  })
  t.true(Test instanceof Model)
})

test('should save', async t => {
  const Test = await db.model('Test', {
    name: { type: String, required: true }
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
