import test from 'ava'
import fileUtils from '../src/fileUtils'
import config from '../src/config'
import { randomString } from './helpers/utils'

const fixturesDir = `${__dirname}/fixtures`

function getTestDir(root = false) {
  const rootDir = `${__dirname}/config-test`
  return root ? rootDir : `${rootDir}/${randomString()}`
}

test.before(async () => {
  await fileUtils.remove(getTestDir(true))
})

test.after(async () => {
  await fileUtils.remove(getTestDir(true))
})

test('should getConfigPath', function* fn(t) {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)

  const configPath = yield config.getConfigPath(testDir)
  t.is(configPath, `${testDir}/evermark.json`)

  t.throws(config.getConfigPath('/test'),
    'Please run `evermark init [destination]` to init a new Evermark folder')
})

test('should getDbPath', function* fn(t) {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)

  const dbPath = yield config.getDbPath(testDir)
  t.is(dbPath, `${testDir}/evermark.db`)
})

test('should readConfig', function* fn(t) {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)

  const conf = yield config.readConfig(testDir)
  t.is(conf.token, 'foo')
  t.false(conf.china)
  t.true(conf.sandbox)

  t.throws(config.readConfig(),
    'Please run `evermark init [destination]` to init a new Evermark folder')
})

test('should getConfig', function* fn(t) {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)

  const token = yield config.getConfig('token', testDir)
  const china = yield config.getConfig('china', testDir)
  const sandbox = yield config.getConfig('sandbox', testDir)
  const hello = yield config.getConfig('hello', testDir)

  t.is(token, 'foo')
  t.false(china)
  t.true(sandbox)
  t.is(hello, undefined)
})

test('should setConfig', function* fn(t) {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)

  let result = yield config.setConfig('token', 'bar', testDir)
  t.is(result, `{
  "token": "bar",
  "china": false,
  "sandbox": true
}`)

  result = yield config.setConfig('china', 'true', testDir)
  t.is(result, `{
  "token": "bar",
  "china": true,
  "sandbox": true
}`)

  result = yield config.setConfig('hello', 'false', testDir)
  t.is(result, `{
  "token": "bar",
  "china": true,
  "sandbox": true,
  "hello": false
}`)

  const conf = yield config.readConfig(testDir)
  t.is(conf.token, 'bar')
  t.true(conf.china)
  t.true(conf.sandbox)
  t.false(conf.hello)
  t.is(conf.hi, undefined)
})

test('should initConfig', function* fn(t) {
  let testDir = getTestDir()
  yield config.initConfig(testDir)

  let conf = yield config.readConfig(testDir)
  t.is(conf.token, 'Your developer token')
  t.true(conf.china)
  t.false(conf.sandbox)
  t.is(conf.highlight, 'github')

  testDir = `${testDir}/`
  yield config.initConfig(testDir)

  conf = yield config.readConfig(testDir)
  t.is(conf.token, 'Your developer token')
  t.true(conf.china)
  t.false(conf.sandbox)
  t.is(conf.highlight, 'github')
})
