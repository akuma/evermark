import test from 'ava'
import sinon from 'sinon'
import Promise from 'bluebird'
import { Evernote } from 'evernote'
import Evermark from '../src/evermark'
import fileUtils from '../src/fileUtils'

const fixturesDir = `${__dirname}/fixtures`
const testDir = `${__dirname}/evermark-test`

test.before(function* fn() {
  yield fileUtils.remove(testDir)
  yield fileUtils.fs.copyAsync(fixturesDir, testDir)
})

test.after(async () => {
  await fileUtils.remove(testDir)
})

test('should createLocalNote', function* fn(t) {
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
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'b'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('updateNote')
    .returns(Promise.resolve(note))
    .once()

  const notePath = `${testDir}/notes/b.md`
  yield evermark.publishNote(notePath)
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should create note if update note is not exist', function* fn() {
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'c'

  const error = new Error('mock error')
  error.identifier = 'Note.guid'

  clientMock.expects('updateNote')
    .returns(Promise.reject(error))
    .once()
  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()

  const notePath = `${testDir}/notes/c.md`
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should create notebook if it is not exist', function* fn() {
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const notebookName = 'foo'
  const note = new Evernote.Note()
  note.guid = 'd'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('listNotebooks')
    .returns(Promise.resolve([]))
    .once()
  clientMock.expects('createNotebook')
    .withArgs(notebookName)
    .returns(Promise.resolve([{ guid: 'notebook-c', name: notebookName }]))
    .once()

  const notePath = `${testDir}/notes/d.md`
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should not create notebook if it is exist', function* fn() {
  const evermark = new Evermark(testDir)

  const client = yield evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const notebookName = 'bar'
  const note = new Evernote.Note()
  note.guid = 'e'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('listNotebooks')
    .returns(Promise.resolve([{ name: notebookName }]))
    .once()
  clientMock.expects('createNotebook').never()

  const notePath = `${testDir}/notes/e.md`
  yield evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})
