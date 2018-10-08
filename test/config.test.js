const path = require('path')
const test = require('ava')
const fileUtils = require('../src/fileUtils')
const config = require('../src/config')
const utils = require('./helpers/utils')

const fixturesDir = path.join(__dirname, 'fixtures')

function getTestDir(root = false) {
  const rootDir = path.join(__dirname, 'config-test')
  return root ? rootDir : path.join(rootDir, utils.randomString())
}

test.before(async () => {
  await fileUtils.remove(getTestDir(true))
})

test.after(async () => {
  await fileUtils.remove(getTestDir(true))
})

test('should getConfigPath', async t => {
  const testDir = getTestDir()
  await fileUtils.copy(fixturesDir, testDir)

  const configPath = await config.getConfigPath(testDir)
  t.is(configPath, path.join(testDir, 'evermark.json'))

  await t.throwsAsync(
    () => config.getConfigPath(path.join('/test')),
    'Please run `evermark init [destination]` to init a new Evermark folder'
  )
})

test('should getDbPath', async t => {
  const testDir = getTestDir()
  await fileUtils.copy(fixturesDir, testDir)

  const dbPath = await config.getDbPath(testDir)
  t.is(dbPath, path.join(testDir, 'evermark.db'))
})

test('should readConfig', async t => {
  const testDir = getTestDir()
  await fileUtils.copy(fixturesDir, testDir)

  const conf = await config.readConfig(testDir)
  t.is(conf.token, 'foo')
  t.false(conf.china)
  t.true(conf.sandbox)
})

test('should readConfig error if config file invalid', async t => {
  await t.throwsAsync(
    () => config.readConfig(),
    'Please run `evermark init [destination]` to init a new Evermark folder'
  )

  const testDir = getTestDir()
  const configPath = path.join(testDir, 'evermark.json')
  await fileUtils.copy(fixturesDir, testDir)

  await fileUtils.writeFile(configPath, 'token')
  await t.throwsAsync(
    () => config.readConfig(testDir),
    `Please write to ${configPath}:\n\n` + `{\n  "token": "xxx",\n  "china": xxx\n}`
  )

  await fileUtils.writeFile(configPath, '{ "china": true }')
  await t.throwsAsync(
    () => config.readConfig(testDir),
    `Please write developer token to ${configPath}\n\n` +
      'To get a developer token, please visit:\n  ' +
      'https://www.evernote.com/api/DeveloperToken.action or ' +
      'https://app.yinxiang.com/api/DeveloperToken.action'
  )
})

test('should getConfig', async t => {
  const testDir = getTestDir()
  await fileUtils.copy(fixturesDir, testDir)

  const token = await config.getConfig('token', testDir)
  const china = await config.getConfig('china', testDir)
  const sandbox = await config.getConfig('sandbox', testDir)
  const hello = await config.getConfig('hello', testDir)

  t.is(token, 'foo')
  t.false(china)
  t.true(sandbox)
  t.is(hello, undefined)
})

test('should setConfig', async t => {
  const testDir = getTestDir()
  await fileUtils.copy(fixturesDir, testDir)

  let result = await config.setConfig('token', 'bar', testDir)
  t.is(
    result,
    `{
  "token": "bar",
  "china": false,
  "sandbox": true
}`
  )

  result = await config.setConfig('china', 'true', testDir)
  t.is(
    result,
    `{
  "token": "bar",
  "china": true,
  "sandbox": true
}`
  )

  result = await config.setConfig('hello', 'false', testDir)
  t.is(
    result,
    `{
  "token": "bar",
  "china": true,
  "sandbox": true,
  "hello": false
}`
  )

  const conf = await config.readConfig(testDir)
  t.is(conf.token, 'bar')
  t.true(conf.china)
  t.true(conf.sandbox)
  t.false(conf.hello)
  t.is(conf.hi, undefined)
})

test('should setConfig error if json stringify error', async t => {
  const testDir = getTestDir()
  await fileUtils.copy(fixturesDir, testDir)

  await t.throwsAsync(
    () =>
      config.setConfig(
        'token',
        {
          get foo() {
            throw new Error('Mock stringify error')
          }
        },
        testDir
      ),
    'Mock stringify error'
  )
})

test('should initConfig', async t => {
  let testDir = getTestDir()
  await config.initConfig(testDir)

  let conf = await config.readConfig(testDir)
  t.is(conf.token, 'Your developer token')
  t.true(conf.china)
  t.false(conf.sandbox)
  t.is(conf.highlight, 'github')

  testDir = path.join(getTestDir(), '/')
  await config.initConfig(testDir)

  conf = await config.readConfig(testDir)
  t.is(conf.token, 'Your developer token')
  t.true(conf.china)
  t.false(conf.sandbox)
  t.is(conf.highlight, 'github')

  await t.throwsAsync(() => config.initConfig(testDir), 'Current directory does already inited')
})
