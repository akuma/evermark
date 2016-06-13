import Promise from 'bluebird'
import { Evernote } from 'evernote'
import { APP_NAME } from './config'

const debug = require('debug')('evernote')

export default class EvernoteClient {
  constructor({ token = '', china = true, sandbox } = { china: true }) {
    if (!token) {
      throw new Error('Missing developer token')
    }

    let serviceHost = sandbox ? 'sandbox.evernote.com' : 'www.evernote.com'
    serviceHost = china ? 'app.yinxiang.com' : serviceHost

    const options = { token, sandbox, serviceHost }
    debug('options: %o', options)
    const client = new Evernote.Client(options)

    const userStore = client.getUserStore()
    this.checkVersion = Promise.promisify(userStore.checkVersion)

    this.noteStore = client.getNoteStore()
    Promise.promisifyAll(this.noteStore)
  }

  listNotebooks() {
    return this.noteStore.listNotebooksAsync()
  }

  createNotebook(name) {
    const notebook = new Evernote.Notebook()
    notebook.name = name
    return this.noteStore.createNotebookAsync(notebook)
  }

  createNote(note) {
    const aNote = note
    const noteAttrs = new Evernote.NoteAttributes()
    noteAttrs.source = APP_NAME
    noteAttrs.sourceApplication = APP_NAME
    noteAttrs.contentClass = APP_NAME // Make the note read-only
    aNote.attributes = noteAttrs
    return this.noteStore.createNoteAsync(aNote)
  }

  updateNote(note) {
    return this.noteStore.updateNoteAsync(note)
  }
}
