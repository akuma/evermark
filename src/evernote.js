import Promise from 'bluebird'
import { Evernote } from 'evernote'

const debug = require('debug')('evernote')

// Define Evernote API error codes
const UNKNOWN = 1
const BAD_DATA_FORMAT = 2
const PERMISSION_DENIED = 3
const INTERNAL_ERROR = 4
const DATA_REQUIRED = 5
const LIMIT_REACHED = 6
const QUOTA_REACHED = 7
const INVALID_AUTH = 8
const AUTH_EXPIRED = 9
const DATA_CONFLICT = 10
const ENML_VALIDATION = 11
const SHARD_UNAVAILABLE = 12
const LEN_TOO_SHORT = 13
const LEN_TOO_LONG = 14
const TOO_FEW = 15
const TOO_MANY = 16
const UNSUPPORTED_OPERATION = 17
const TAKEN_DOWN = 18
const RATE_LIMIT_REACHED = 19
const OBJECT_NOT_FOUND = 100

export default class EvernoteClient {
  constructor({ token, china = true, sandbox = false } = { china: true, sandbox: false }) {
    if (!token) {
      throw new Error('Missing developer token')
    }

    let serviceHost = china ? 'app.yinxiang.com' : 'www.evernote.com'
    serviceHost = sandbox ? 'sandbox.evernote.com' : serviceHost

    const options = { token, sandbox, serviceHost }
    debug('options: %o', options)
    this.options = options

    const client = new Evernote.Client(options)
    this.noteStore = client.getNoteStore()

    if (!this.noteStore.listNotebooksAsync) {
      Promise.promisifyAll(this.noteStore)
    }
  }

  listNotebooks() {
    return this.noteStore.listNotebooksAsync()
      .catch(e => {
        throw new Error(`Evernote API ${e}`)
      })
  }

  createNotebook(name) {
    const notebook = new Evernote.Notebook()
    notebook.name = name
    return this.noteStore.createNotebookAsync(notebook)
      .catch(e => {
        throw new Error(`Evernote API ${e}`)
      })
  }

  createNote(note) {
    return this.noteStore.createNoteAsync(note)
      .catch(e => {
        throw new Error(`Evernote API ${e}`)
      })
  }

  updateNote(note) {
    return this.noteStore.updateNoteAsync(note)
      .catch(e => {
        throw new Error(`Evernote API ${e}`)
      })
  }
}
