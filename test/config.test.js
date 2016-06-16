import test from 'ava'
import fileUtils from '../src/fileUtils'
import * as config from '../src/config'

const fixturesDir = `${__dirname}/fixtures`

function getTestDir(id) {
  return `${__dirname}/config-test-${id}`
}

test.after(async () => {
  await fileUtils.remove(getTestDir('*'))
})

test('should getConfigPath', function* fn(t) {
  const testDir = getTestDir('a')
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const configPath = yield config.getConfigPath(testDir)
  t.is(configPath, `${testDir}/evermark.json`)
})

test('should readConfig', function* fn(t) {
  const testDir = getTestDir('b')
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const conf = yield config.readConfig(testDir)
  t.is(conf.token, 'foo')
  t.true(conf.china)
  t.true(conf.sandbox)
})

test('should getConfig', function* fn(t) {
  const testDir = getTestDir('c')
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const token = yield config.getConfig('token', testDir)
  const china = yield config.getConfig('china', testDir)
  const sandbox = yield config.getConfig('sandbox', testDir)
  const hello = yield config.getConfig('hello', testDir)

  t.is(token, 'foo')
  t.true(china)
  t.true(sandbox)
  t.is(hello, undefined)
})

test('should setConfig', function* fn(t) {
  const testDir = getTestDir('d')
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  yield config.setConfig('token', 'bar', testDir)
  yield config.setConfig('china', 'false', testDir)
  yield config.setConfig('hello', 'world', testDir)
  const conf = yield config.readConfig(testDir)
  t.is(conf.token, 'bar')
  t.false(conf.china)
  t.true(conf.sandbox)
  t.is(conf.hello, 'world')
  t.is(conf.hi, undefined)
})

test('should initConfig', function* fn(t) {
  const testDir = getTestDir('e')
  yield config.initConfig(testDir)
  const conf = yield config.readConfig(testDir)
  t.is(conf.token, 'Your developer token')
  t.true(conf.china)
})
