import test from 'ava'
import sinon from 'sinon'
import Promise from 'bluebird'
import { Evernote } from 'evernote'
import { OBJECT_NOT_FOUND } from '../src/evernote'
import Evermark from '../src/evermark'
import fileUtils from '../src/fileUtils'
import { randomString } from './helpers/utils'

const fixturesDir = `${__dirname}/fixtures`

function getTestDir(root = false) {
  const rootDir = `${__dirname}/evermark-test`
  return root ? rootDir : `${rootDir}/${randomString()}`
}

test.before(function* fn() {
  yield fileUtils.remove(getTestDir(true))
})

test.after(async () => {
  await fileUtils.remove(getTestDir(true))
})

test('should createLocalNote', function* fn(t) {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const title = 'test'
  const notePath = yield evermark.createLocalNote(title)
  t.is(notePath, `${testDir}/notes/${title}.md`)

  const noteContent = yield fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  try {
    yield evermark.createLocalNote(title)
  } catch (e) {
    t.is(e.message, `Note with filename ${title}.md is exists`)
  }
})

test('should create note if it is not exist', function* fn() {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'a'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('updateNote').never()

  const notePath = `${testDir}/notes/a.md`
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should update note if it is exist', function* fn() {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'a'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('updateNote')
    .returns(Promise.resolve(note))
    .once()

  const notePath = `${testDir}/notes/a.md`
  yield evermark.publishNote(notePath)
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should create note if update note is not exist', function* fn() {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'b'

  const error = new Error()
  error.code = OBJECT_NOT_FOUND
  error.message = 'Evernote API Error: OBJECT_NOT_FOUND\n\nObject not found by identifier Note.guid'

  clientMock.expects('updateNote')
    .returns(Promise.reject(error))
    .once()
  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  const notePath = `${testDir}/notes/b.md`
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should create notebook if it is not exist', function* fn() {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const notebookName = 'foo'
  const note = new Evernote.Note()
  note.guid = 'c'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('listNotebooks')
    .returns(Promise.resolve([]))
    .once()
  clientMock.expects('createNotebook')
    .withArgs(notebookName)
    .returns(Promise.resolve([{ guid: 'foo', name: notebookName }]))
    .once()

  const notePath = `${testDir}/notes/c.md`
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should not create notebook if it is exist', function* fn() {
  const testDir = getTestDir()
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const notebookName = 'bar'
  const note = new Evernote.Note()
  note.guid = 'd'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('listNotebooks')
    .returns(Promise.resolve([{ name: notebookName }]))
    .once()
  clientMock.expects('createNotebook').never()

  const notePath = `${testDir}/notes/d.md`
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})
