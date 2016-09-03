import path from 'path'
import test from 'ava'
import Promise from 'bluebird'
import fileUtils from '../src/fileUtils'

const testDir = path.join(__dirname, 'fileutils-test')

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
  const dir = path.join(testDir, 'foo/bar')
  let exists = await fileUtils.exists(dir)
  t.false(exists)

  await fileUtils.ensureDir(dir)
  exists = await fileUtils.exists(dir)
  t.true(exists)
})

test('should ensureFile', async t => {
  const file = path.join(testDir, 'foo/a.txt')
  let exists = await fileUtils.exists(file)
  t.false(exists)

  await fileUtils.ensureFile(file)
  exists = await fileUtils.exists(file)
  t.true(exists)
})

test('should remove', async t => {
  const file = path.join(testDir, 'foo/b.txt')
  await fileUtils.ensureFile(file)
  let exists = await fileUtils.exists(file)
  t.true(exists)

  await fileUtils.remove(file)
  exists = await fileUtils.exists(file)
  t.false(exists)
})

test('should readFile & writeFile', async t => {
  const file = path.join(testDir, 'foo/c.txt')
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
  const filePath = path.join(testDir, filename)
  await fileUtils.ensureFile(filePath)

  let result = await fileUtils.searchFile(filename, testDir)
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, path.join(testDir, 'foo'))
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, path.join(testDir, 'foo/'))
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, path.join(testDir, 'foo/bar'))
  t.is(result, filePath)

  result = await fileUtils.searchFile(filename, path.join('/test'))
  t.is(result, null)

  result = await fileUtils.searchFile('not-exists-file.txt')
  t.is(result, null)
})

test('should get unique file path', async t => {
  await Promise.all([
    fileUtils.ensureFile(path.join(testDir, 'e.txt')),
    fileUtils.ensureFile(path.join(testDir, 'e-12.txt')),
    fileUtils.ensureFile(path.join(testDir, 'e-010.txt')),
    fileUtils.ensureFile(path.join(testDir, 'e-5.txt')),
    fileUtils.ensureFile(path.join(testDir, 'f-011.md')),
    fileUtils.ensureFile(path.join(testDir, 'g.md')),
    fileUtils.ensureFile(path.join(testDir, 'h')),
    fileUtils.ensureFile(path.join(testDir, 'h-100')),
  ])

  t.is(await fileUtils.uniquePath(path.join(testDir, 'e.txt')), path.join(testDir, 'e-13.txt'))
  t.is(await fileUtils.uniquePath(path.join(testDir, 'f.txt')), path.join(testDir, 'f.txt'))
  t.is(await fileUtils.uniquePath(path.join(testDir, 'g.md')), path.join(testDir, 'g-1.md'))
  t.is(await fileUtils.uniquePath(path.join(testDir, 'h')), path.join(testDir, 'h-101'))
})
