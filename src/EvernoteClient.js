const Evernote = require('evernote')
const debug = require('debug')('evernote')
const EvermarkError = require('./EvermarkError')

// Define Evernote API error codes
const UNKNOWN_ERROR = 1
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

const ERROR_CODES = {
  [UNKNOWN_ERROR]: 'UNKNOWN',
  [BAD_DATA_FORMAT]: 'BAD_DATA_FORMAT',
  [PERMISSION_DENIED]: 'PERMISSION_DENIED',
  [INTERNAL_ERROR]: 'INTERNAL_ERROR',
  [DATA_REQUIRED]: 'DATA_REQUIRED',
  [LIMIT_REACHED]: 'LIMIT_REACHED',
  [QUOTA_REACHED]: 'QUOTA_REACHED',
  [INVALID_AUTH]: 'INVALID_AUTH',
  [AUTH_EXPIRED]: 'AUTH_EXPIRED',
  [DATA_CONFLICT]: 'DATA_CONFLICT',
  [ENML_VALIDATION]: 'ENML_VALIDATION',
  [SHARD_UNAVAILABLE]: 'SHARD_UNAVAILABLE',
  [LEN_TOO_SHORT]: 'LEN_TOO_SHORT',
  [LEN_TOO_LONG]: 'LEN_TOO_LONG',
  [TOO_FEW]: 'TOO_FEW',
  [TOO_MANY]: 'TOO_MANY',
  [UNSUPPORTED_OPERATION]: 'UNSUPPORTED_OPERATION',
  [TAKEN_DOWN]: 'TAKEN_DOWN',
  [RATE_LIMIT_REACHED]: 'RATE_LIMIT_REACHED',
  [OBJECT_NOT_FOUND]: 'OBJECT_NOT_FOUND'
}

// Define Evernote default resource type
const DEFAULT_RESOURCE_TYPE = 'application/octet-stream'

// Define Evernote resource type mappings
const RESOURCE_TYPES = {
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
}

function wrapError(exception) {
  const error = new EvermarkError()

  error.code = exception.errorCode || UNKNOWN_ERROR
  if (exception.identifier) {
    error.code = OBJECT_NOT_FOUND
  }

  const codeStr = ERROR_CODES[error.code] || ERROR_CODES[UNKNOWN_ERROR]
  const message = `Evernote API Error: ${codeStr}`

  if (exception.parameter) {
    error.message = `${message}\n\nThe invalid parameter: ${exception.parameter}`
  }

  if (exception.message) {
    error.message = `${message}\n\n${exception.message}`
  }

  if (exception.identifier) {
    error.message = `${message}\n\nObject not found by identifier ${exception.identifier}`
  }

  return error
}

class EvernoteClient {
  constructor({ token, china = true, sandbox = false } = { china: true, sandbox: false }) {
    if (!token) {
      throw new EvermarkError('Missing developer token')
    }

    let serviceHost = china ? 'app.yinxiang.com' : 'www.evernote.com'
    serviceHost = sandbox ? 'sandbox.evernote.com' : serviceHost

    const options = { token, sandbox, serviceHost }
    debug('Evernote client options: %o', options)
    this.options = options

    const client = new Evernote.Client(options)
    this.noteStore = client.getNoteStore()
  }

  listNotebooks() {
    return this.noteStore.listNotebooks().catch(e => {
      throw wrapError(e)
    })
  }

  createNotebook(name) {
    const notebook = new Evernote.Types.Notebook()
    notebook.name = name
    return this.noteStore.createNotebook(notebook).catch(e => {
      throw wrapError(e)
    })
  }

  createNote(note) {
    return this.noteStore.createNote(note).catch(e => {
      throw wrapError(e)
    })
  }

  updateNote(note) {
    return this.noteStore.updateNote(note).catch(e => {
      throw wrapError(e)
    })
  }

  expungeNote(guid) {
    return this.noteStore.expungeNote(guid).catch(e => {
      throw wrapError(e)
    })
  }
}

module.exports = {
  UNKNOWN_ERROR,
  BAD_DATA_FORMAT,
  PERMISSION_DENIED,
  INTERNAL_ERROR,
  DATA_REQUIRED,
  LIMIT_REACHED,
  QUOTA_REACHED,
  INVALID_AUTH,
  AUTH_EXPIRED,
  DATA_CONFLICT,
  ENML_VALIDATION,
  SHARD_UNAVAILABLE,
  LEN_TOO_SHORT,
  LEN_TOO_LONG,
  TOO_FEW,
  TOO_MANY,
  UNSUPPORTED_OPERATION,
  TAKEN_DOWN,
  RATE_LIMIT_REACHED,
  OBJECT_NOT_FOUND,
  DEFAULT_RESOURCE_TYPE,
  RESOURCE_TYPES,
  Evernote,
  EvernoteClient
}
