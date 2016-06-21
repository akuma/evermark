import test from 'ava'
import fileUtils from '../src/fileUtils'

const testDir = `${__dirname}/fileutils-test`

test.before(async () => {
  await fileUtils.remove(testDir)
})

test.after(async () => {
  await fileUtils.remove(testDir)
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

  let content = await fileUtils.readFile(file)
  t.is(content, '测试')

  content = await fileUtils.readFile(file, 'base64')
  t.is(content, '5rWL6K+V')
})

test('should searchFile', async t => {
  const filename = 'd.txt'
  const filePath = `${testDir}/${filename}`
  await fileUtils.ensureFile(filePath)

  let result = await fileUtils.searchFile(filename, `${testDir}`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, `${testDir}/foo`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, `${testDir}/foo/`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, `${testDir}/foo//`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, `${testDir}/foo/bar`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, '/test')
  t.is(result, null)

  result = await fileUtils.searchFile('not-exists-file.txt')
  t.is(result, null)
})
