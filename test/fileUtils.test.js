import path from 'path'
import test from 'ava'
import fileUtils from '../src/fileUtils'

const testDir = `${__dirname}${path.sep}fileutils-test`

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
  const dir = `${testDir}${path.sep}foo${path.sep}bar`
  let exists = await fileUtils.exists(dir)
  t.false(exists)

  await fileUtils.ensureDir(dir)
  exists = await fileUtils.exists(dir)
  t.true(exists)
})

test('should ensureFile', async t => {
  const file = `${testDir}${path.sep}foo${path.sep}a.txt`
  let exists = await fileUtils.exists(file)
  t.false(exists)

  await fileUtils.ensureFile(file)
  exists = await fileUtils.exists(file)
  t.true(exists)
})

test('should remove', async t => {
  const file = `${testDir}${path.sep}foo${path.sep}b.txt`
  await fileUtils.ensureFile(file)
  let exists = await fileUtils.exists(file)
  t.true(exists)

  await fileUtils.remove(file)
  exists = await fileUtils.exists(file)
  t.false(exists)
})

test('should readFile & writeFile', async t => {
  const file = `${testDir}${path.sep}foo${path.sep}c.txt`
  let exists = await fileUtils.exists(file)
  t.false(exists)

  await fileUtils.writeFile(file, '测试')
  exists = await fileUtils.exists(file)
  t.true(exists)

  let content = await fileUtils.readFile(file)
  t.is(content, '测试')

  content = await fileUtils.readFile(file, 'base64')
  t.is(content, new Buffer('测试').toString('base64'))
})

test('should searchFile', async t => {
  const filename = 'd.txt'
  const filePath = `${testDir}${path.sep}${filename}`
  await fileUtils.ensureFile(filePath)

  let result = await fileUtils.searchFile(filename, `${testDir}`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, `${testDir}${path.sep}foo`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, `${testDir}${path.sep}foo${path.sep}`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, `${testDir}${path.sep}foo${path.sep}${path.sep}`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, `${testDir}${path.sep}foo${path.sep}bar`)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, '${path.sep}test')
  t.is(result, null)

  result = await fileUtils.searchFile('not-exists-file.txt')
  t.is(result, null)
})

test('should get unique file path', async t => {
  await Promise.all([
    fileUtils.ensureFile(`${testDir}${path.sep}e.txt`),
    fileUtils.ensureFile(`${testDir}${path.sep}e-12.txt`),
    fileUtils.ensureFile(`${testDir}${path.sep}e-010.txt`),
    fileUtils.ensureFile(`${testDir}${path.sep}e-5.txt`),
    fileUtils.ensureFile(`${testDir}${path.sep}f-011.md`),
    fileUtils.ensureFile(`${testDir}${path.sep}g.md`),
    fileUtils.ensureFile(`${testDir}${path.sep}h`),
    fileUtils.ensureFile(`${testDir}${path.sep}h-100`),
  ])

  t.is(await fileUtils.uniquePath(`${testDir}${path.sep}e.txt`), `${testDir}${path.sep}e-13.txt`)
  t.is(await fileUtils.uniquePath(`${testDir}${path.sep}f.txt`), `${testDir}${path.sep}f.txt`)
  t.is(await fileUtils.uniquePath(`${testDir}${path.sep}g.md`), `${testDir}${path.sep}g-1.md`)
  t.is(await fileUtils.uniquePath(`${testDir}${path.sep}h`), `${testDir}${path.sep}h-101`)
})
