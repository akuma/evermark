import test from 'ava'
import sinon from 'sinon'
import { Evernote } from 'evernote'
import EvernoteClient from '../src/evernote'

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

  const listNotebooksAsync = sinon.stub(
    client.noteStore, 'listNotebooksAsync', () => Promise.resolve([]))
  const notebooks = await client.listNotebooks()
  t.deepEqual(notebooks, [])

  listNotebooksAsync.restore()
  sinon.assert.calledWith(listNotebooksAsync)
})

test('should createNotebook', () => {
  const client = new EvernoteClient({ token })

  const createNotebookAsync = sinon.stub(client.noteStore, 'createNotebookAsync')
  const notebookName = 'test'
  client.createNotebook(notebookName)

  createNotebookAsync.restore()
  const notebook = new Evernote.Notebook()
  notebook.name = notebookName
  sinon.assert.calledWith(createNotebookAsync, notebook)
})

test('should createNote', () => {
  const client = new EvernoteClient({ token })

  const createNoteAsync = sinon.stub(client.noteStore, 'createNoteAsync')
  const note = new Evernote.Note()
  client.createNote(note)

  createNoteAsync.restore()
  sinon.assert.calledWith(createNoteAsync, note)
})

test('should createNote', () => {
  const client = new EvernoteClient({ token })

  const updateNoteAsync = sinon.stub(client.noteStore, 'updateNoteAsync')
  const note = new Evernote.Note()
  client.updateNote(note)

  updateNoteAsync.restore()
  sinon.assert.calledWith(updateNoteAsync, note)
})
