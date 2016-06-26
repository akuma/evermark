import test from 'ava'
import sinon from 'sinon'
import Promise from 'bluebird'
import { Evernote } from 'evernote'
import EvernoteClient, { BAD_DATA_FORMAT } from '../src/evernote'

const token = 'test'

test('should throw error if token parameter is empty', t => {
  t.throws(() => new EvernoteClient(), 'Missing developer token')
  t.throws(() => new EvernoteClient({ token: null }), 'Missing developer token')
  t.throws(() => new EvernoteClient({ token: '' }), 'Missing developer token')
})

test('should create success if token parameter is not empty', function* fn(t) {
  let client = new EvernoteClient({ token })
  t.true(client instanceof EvernoteClient)
  let opts = { token, sandbox: false, serviceHost: 'app.yinxiang.com' }
  t.deepEqual(client.options, opts)

  client = new EvernoteClient({ token, sandbox: true })
  opts = { token, sandbox: true, serviceHost: 'sandbox.evernote.com' }
  t.deepEqual(client.options, opts)

  client = new EvernoteClient({ token, sandbox: false })
  opts = { token, sandbox: false, serviceHost: 'app.yinxiang.com' }
  t.deepEqual(client.options, opts)

  client = new EvernoteClient({ token, china: true })
  opts = { token, sandbox: false, serviceHost: 'app.yinxiang.com' }
  t.deepEqual(client.options, opts)

  client = new EvernoteClient({ token, china: false })
  opts = { token, sandbox: false, serviceHost: 'www.evernote.com' }
  t.deepEqual(client.options, opts)
})

test('should listNotebooks', async t => {
  const client = new EvernoteClient({ token })

  const listNotebooksAsync = sinon.stub(client.noteStore, 'listNotebooksAsync')
    .returns(Promise.resolve([]))
  const notebooks = await client.listNotebooks()
  t.deepEqual(notebooks, [])

  listNotebooksAsync.restore()
  sinon.assert.calledWith(listNotebooksAsync)
})

test('should reject if listNotebooks error', t => {
  const client = new EvernoteClient({ token })

  const error = new Error()
  error.errorCode = BAD_DATA_FORMAT
  error.parameter = 'Note.title'

  const listNotebooksAsync = sinon.stub(client.noteStore, 'listNotebooksAsync')
    .returns(Promise.reject(error))
  t.throws(client.listNotebooks(), 'Evernote API Error: BAD_DATA_FORMAT\n' +
    `The invalid parameter: ${error.parameter}`)

  listNotebooksAsync.restore()
  sinon.assert.calledWith(listNotebooksAsync)
})

test('should createNotebook', async () => {
  const client = new EvernoteClient({ token })

  const notebookName = 'test'
  const createNotebookAsync = sinon.stub(client.noteStore, 'createNotebookAsync')
    .returns(Promise.resolve({ name: notebookName }))
  await client.createNotebook(notebookName)

  createNotebookAsync.restore()
  const notebook = new Evernote.Notebook()
  notebook.name = notebookName
  sinon.assert.calledWith(createNotebookAsync, notebook)
})

test('should reject if createNotebook error', t => {
  const client = new EvernoteClient({ token })

  const error = new Error()
  error.errorCode = BAD_DATA_FORMAT
  error.parameter = 'Note.title'

  const createNotebookAsync = sinon.stub(client.noteStore, 'createNotebookAsync')
    .returns(Promise.reject(error))
  const notebookName = 'test'
  t.throws(client.createNotebook(notebookName), 'Evernote API Error: BAD_DATA_FORMAT\n' +
    `The invalid parameter: ${error.parameter}`)

  createNotebookAsync.restore()
  const notebook = new Evernote.Notebook()
  notebook.name = notebookName
  sinon.assert.calledWith(createNotebookAsync, notebook)
})

test('should createNote', async () => {
  const client = new EvernoteClient({ token })

  const note = new Evernote.Note()
  const createNoteAsync = sinon.stub(client.noteStore, 'createNoteAsync')
    .returns(Promise.resolve(note))
  await client.createNote(note)

  createNoteAsync.restore()
  sinon.assert.calledWith(createNoteAsync, note)
})

test('should reject if createNote error', t => {
  const client = new EvernoteClient({ token })

  const error = new Error()
  error.errorCode = BAD_DATA_FORMAT
  error.parameter = 'Note.title'

  const createNoteAsync = sinon.stub(client.noteStore, 'createNoteAsync')
    .returns(Promise.reject(error))
  const note = new Evernote.Note()
  t.throws(client.createNote(note), 'Evernote API Error: BAD_DATA_FORMAT\n' +
    `The invalid parameter: ${error.parameter}`)

  createNoteAsync.restore()
  sinon.assert.calledWith(createNoteAsync, note)
})

test('should updateNote', async () => {
  const client = new EvernoteClient({ token })

  const note = new Evernote.Note()
  const updateNoteAsync = sinon.stub(client.noteStore, 'updateNoteAsync')
    .returns(Promise.resolve(note))
  await client.updateNote(note)

  updateNoteAsync.restore()
  sinon.assert.calledWith(updateNoteAsync, note)
})

test('should reject if updateNote error', t => {
  const client = new EvernoteClient({ token })

  const error = new Error()
  error.errorCode = BAD_DATA_FORMAT
  error.parameter = 'Note.title'

  const updateNoteAsync = sinon.stub(client.noteStore, 'updateNoteAsync')
    .returns(Promise.reject(error))
  const note = new Evernote.Note()
  t.throws(client.updateNote(note), 'Evernote API Error: BAD_DATA_FORMAT\n' +
    `The invalid parameter: ${error.parameter}`)

  updateNoteAsync.restore()
  sinon.assert.calledWith(updateNoteAsync, note)
})
