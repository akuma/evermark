import test from 'ava'
import path from 'path'
import fileUtils from '../src/fileUtils'

const testDir = path.normalize(`${__dirname}/../build/test`)

test.before(async t => {
  await fileUtils.remove(testDir)
  const exists = await fileUtils.exists(testDir)
  t.false(exists)
})

test.after(async t => {
  await fileUtils.remove(testDir)
  const exists = await fileUtils.exists(testDir)
  t.false(exists)
})

test('should exists', async t => {
  const exists = await fileUtils.exists(testDir)
  t.false(exists)
})

test('should ensureDir', async t => {
  const dir = `${testDir}/foo/bar`
  let exists = await fileUtils.exists(dir)
  t.false(exists)

  await fileUtils.ensureDir(dir)
  exists = await fileUtils.exists(dir)
  t.true(exists)
})

test('should ensureFile', async t => {
  const file = `${testDir}/foo/a.txt`
  let exists = await fileUtils.exists(file)
  t.false(exists)

  await fileUtils.ensureFile(file)
  exists = await fileUtils.exists(file)
  t.true(exists)
})

test('should remove', async t => {
  const file = `${testDir}/foo/b.txt`
  await fileUtils.ensureFile(file)
  let exists = await fileUtils.exists(file)
  t.true(exists)

  await fileUtils.remove(file)
  exists = await fileUtils.exists(file)
  t.false(exists)
})

test('should readFile & writeFile', async t => {
  const file = `${testDir}/foo/c.txt`
  let exists = await fileUtils.exists(file)
  t.false(exists)

  await fileUtils.writeFile(file, '测试')
  exists = await fileUtils.exists(file)
  t.true(exists)

  const content = await fileUtils.readFile(file)
  t.is(content, '测试')
})

test('should searchFile', async t => {
  const filename = 'd.txt'
  const filePath = `${testDir}/${filename}`
  await fileUtils.ensureFile(filePath)

  let exists = await fileUtils.searchFile(filename, `${testDir}`)
  t.is(exists, filePath)

  exists = await fileUtils.searchFile(filename, `${testDir}/foo`)
  t.is(exists, filePath)

  exists = await fileUtils.searchFile(filename, `${testDir}/foo/`)
  t.is(exists, filePath)

  exists = await fileUtils.searchFile(filename, `${testDir}/foo//`)
  t.is(exists, filePath)
})
