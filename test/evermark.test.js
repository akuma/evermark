import test from 'ava'
import * as evermark from '../src/evermark'
import fileUtils from '../src/fileUtils'

const fixturesDir = `${__dirname}/fixtures`
const testDir = `${__dirname}/evermark-test`

test.before(async () => {
  await fileUtils.remove(testDir)
})

test.after(async () => {
  await fileUtils.remove(testDir)
})

test('should createLocalNote', function* fn(t) {
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)

  const title = 'test'
  const notePath = yield evermark.createLocalNote(title, testDir)
  t.is(notePath, `${testDir}/notes/${title}.md`)

  const noteContent = yield fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  try {
    yield evermark.createLocalNote(title, testDir)
  } catch (e) {
    t.is(e.message, `Note with title ${title} is exists`)
  }
})
