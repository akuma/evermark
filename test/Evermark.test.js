import path from 'path'
import test from 'ava'
import sinon from 'sinon'
import Promise from 'bluebird'
import { Evernote } from 'evernote'
import { OBJECT_NOT_FOUND } from '../src/EvernoteClient'
import Evermark from '../src/Evermark'
import fileUtils from '../src/fileUtils'
import utils from './helpers/utils'

const fixturesDir = path.join(__dirname, 'fixtures')

function getTestDir(root = false) {
  const rootDir = path.join(__dirname, 'evermark-test')
  return root ? rootDir : path.join(rootDir, utils.randomString())
}

test.before(async () => {
  await fileUtils.remove(getTestDir(true))
})

test.after(async () => {
  await fileUtils.remove(getTestDir(true))
})

test('should create local note', async (t) => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  let title = 'test'
  let notePath = await evermark.createLocalNote(title)
  t.is(notePath, path.join(testDir, `notes/${title}.md`))
  let noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  notePath = await evermark.createLocalNote(title)
  t.is(notePath, path.join(testDir, `notes/${title}-1.md`))
  noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  title = '/-foo/---bar///---'
  notePath = await evermark.createLocalNote(title)
  t.is(notePath, path.join(testDir, 'notes/foo-bar.md'))
  noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  notePath = await evermark.createLocalNote(title)
  t.is(notePath, path.join(testDir, 'notes/foo-bar-1.md'))
  noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  notePath = await evermark.createLocalNote(title)
  t.is(notePath, path.join(testDir, 'notes/foo-bar-2.md'))
  noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)
})

test('should create note if the note does not exist', async () => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = await evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'a'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('updateNote').never()

  const notePath = path.join(testDir, 'notes/a.md')
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should update note if the note exists', async () => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = await evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'a'

  clientMock.expects('createNote')
    .returns(Promise.resolve(note))
    .once()
  clientMock.expects('updateNote')
    .returns(Promise.resolve(note))
    .once()

  const notePath = path.join(testDir, 'notes/a.md')
  await evermark.publishNote(notePath)
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should create note if the note which to update does not exist', async () => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = await evermark.getEvernoteClient()
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
  const notePath = path.join(testDir, 'notes/b.md')
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should create notebook if the notebook does not exist', async () => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = await evermark.getEvernoteClient()
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

  const notePath = path.join(testDir, 'notes/c.md')
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should not create notebook if the notebook exists', async () => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = await evermark.getEvernoteClient()
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

  const notePath = path.join(testDir, 'notes/d.md')
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should unpublish note', async (t) => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = await evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'a'

  clientMock.expects('createNote').returns(Promise.resolve(note))
  clientMock.expects('expungeNote').returns(Promise.resolve(1))

  const notePath = path.join(testDir, 'notes/a.md')
  await evermark.publishNote(notePath)
  const result = await evermark.unpublishNote(notePath)
  t.is(result, notePath)

  const notExistNote = path.join('/not/exist/note.md')
  t.throws(evermark.unpublishNote(notExistNote), `${notExistNote} is not a published note`)

  clientMock.verify()
  clientMock.restore()
})
