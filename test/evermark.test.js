import path from 'path'
import test from 'ava'
import sinon from 'sinon'
import Promise from 'bluebird'
import { Evernote } from 'evernote'
import { OBJECT_NOT_FOUND } from '../src/evernote'
import Evermark from '../src/evermark'
import fileUtils from '../src/fileUtils'
import utils from './helpers/utils'

const fixturesDir = `${__dirname}${path.sep}fixtures`

function getTestDir(root = false) {
  const rootDir = `${__dirname}${path.sep}evermark-test`
  return root ? rootDir : `${rootDir}${path.sep}${utils.randomString()}`
}

test.before(async () => {
  await fileUtils.remove(getTestDir(true))
})

test.after(async () => {
  await fileUtils.remove(getTestDir(true))
})

test('should create local note', async t => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  let title = 'test'
  let notePath = await evermark.createLocalNote(title)
  t.is(notePath, `${testDir}${path.sep}notes${path.sep}${title}.md`)
  let noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  notePath = await evermark.createLocalNote(title)
  t.is(notePath, `${testDir}${path.sep}notes${path.sep}${title}-1.md`)
  noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  title = '/-foo/---bar///---'
  notePath = await evermark.createLocalNote(title)
  t.is(notePath, `${testDir}${path.sep}notes${path.sep}foo-bar.md`)
  noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  notePath = await evermark.createLocalNote(title)
  t.is(notePath, `${testDir}${path.sep}notes${path.sep}foo-bar-1.md`)
  noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)

  notePath = await evermark.createLocalNote(title)
  t.is(notePath, `${testDir}${path.sep}notes${path.sep}foo-bar-2.md`)
  noteContent = await fileUtils.readFile(notePath)
  t.is(noteContent, `# ${title}\n`)
})

test('should create note if it is not exist', async () => {
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

  const notePath = `${testDir}${path.sep}notes${path.sep}a.md`
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should update note if it is exist', async () => {
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

  const notePath = `${testDir}${path.sep}notes${path.sep}a.md`
  await evermark.publishNote(notePath)
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should create note if update note is not exist', async () => {
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
  const notePath = `${testDir}${path.sep}notes${path.sep}b.md`
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should create notebook if it is not exist', async () => {
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

  const notePath = `${testDir}${path.sep}notes${path.sep}c.md`
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should not create notebook if it is exist', async () => {
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

  const notePath = `${testDir}${path.sep}notes${path.sep}d.md`
  await evermark.publishNote(notePath)

  clientMock.verify()
  clientMock.restore()
})

test('should unpublish note', async t => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)
  const evermark = new Evermark(testDir)

  const client = await evermark.getEvernoteClient()
  const clientMock = sinon.mock(client)

  const note = new Evernote.Note()
  note.guid = 'a'

  clientMock.expects('createNote').returns(Promise.resolve(note))
  clientMock.expects('expungeNote').returns(Promise.resolve(1))

  const notePath = `${testDir}${path.sep}notes${path.sep}a.md`
  await evermark.publishNote(notePath)
  const result = await evermark.unpublishNote(notePath)
  t.is(result, notePath)

  t.throws(evermark.unpublishNote(`${path.sep}not${path.sep}exist${path.sep}note.md`),
    `${path.sep}not${path.sep}exist${path.sep}note.md is not a published note`)

  clientMock.verify()
  clientMock.restore()
})
