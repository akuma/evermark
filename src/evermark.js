import path from 'path'
import Remarkable from 'remarkable'
import hljs from 'highlight.js'
import inlineCss from 'inline-css'
import { Evernote } from 'evernote'
import fileUtils from './fileUtils'
import EvernoteClient from './evernote'
import DB from './db'
import { APP_NAME, getConfigPath, getDbPath, readConfig } from './config'

let evernoteClient = null
const debug = require('debug')('evermark')

const remarkable = new Remarkable({
  html: false,    // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />)

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, code).value
      } catch (e) {
        // Ignore
      }
    }

    try {
      return hljs.highlightAuto(code).value
    } catch (e) {
      // Ignore
    }

    return ''
  },
})

// Add inline code class
const codeRule = remarkable.renderer.rules.code
remarkable.renderer.rules.code = (...args) => {
  const result = codeRule.call(remarkable, ...args)
  return result.replace('<code>', '<code class="inline">')
}

// Add block code class
const fenceRule = remarkable.renderer.rules.fence
remarkable.renderer.rules.fence = (...args) => {
  const result = fenceRule.call(remarkable, ...args)
  return result.replace('<pre>', '<pre class="hljs">')
}

export function* createLocalNote(title, dir) {
  const configPath = yield getConfigPath(dir)
  const noteDir = path.dirname(configPath)
  const notePath = `${noteDir}/notes/${title}.md`
  const isExists = yield fileUtils.exists(notePath)
  if (isExists) {
    throw new Error(`Note with title ${title} is exists`)
  }

  yield fileUtils.ensureFile(notePath)
  yield fileUtils.writeFile(notePath, `# ${title}\n`)
  return notePath
}

export function* publishNote(notePath) {
  const content = yield fileUtils.readFile(notePath)
  return yield saveNote(content, notePath)
}

function* saveNote(content, notePath) {
  const note = new Evernote.Note()

  const tokens = remarkable.parse(content, {})
  const noteInfo = parseNoteInfo(tokens)
  note.title = noteInfo.noteTitle

  if (noteInfo.notebookName) {
    const createdNotebook = yield createNotebookIfPossible(noteInfo.notebookName)
    note.notebookGuid = createdNotebook.guid
  }

  if (noteInfo.tagNames && noteInfo.tagNames.length) {
    note.tagNames = noteInfo.tagNames
  }

  // The content of an Evernote note is represented using Evernote Markup Language
  // (ENML). The full ENML specification can be found in the Evernote API Overview
  // at http://dev.evernote.com/documentation/cloud/chapters/ENML.php
  const htmlContent = yield generateHtml(tokens)
  note.content = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">' +
    `<en-note>${htmlContent}</en-note>`

  return yield doSaveNote(note, notePath)
}

function* doSaveNote(note, notePath) {
  const enClient = yield getEvernoteClient()
  const db = yield getDB()
  const Note = yield db.model('notes', {
    guid: String,
    path: String,
    created: { type: Date, default: Date.now },
  })

  const dbNote = Note.findOne({ path: notePath })
  if (dbNote) {
    const aNote = note
    aNote.guid = dbNote.guid
    const updatedNote = yield enClient.updateNote(aNote)
    return updatedNote
  }

  const aNote = note
  const noteAttrs = new Evernote.NoteAttributes()
  noteAttrs.source = APP_NAME
  noteAttrs.sourceApplication = APP_NAME
  noteAttrs.contentClass = APP_NAME // Make the note read-only
  aNote.attributes = noteAttrs

  const createdNote = yield enClient.createNote(aNote)
  yield Note.insert({ guid: createdNote.guid, path: notePath })
  yield db.save()
  return createdNote
}

function* createNotebookIfPossible(name) {
  const enClient = yield getEvernoteClient()
  const notebooks = yield enClient.listNotebooks()
  let notebook = notebooks.find(nb => nb.name === name)
  if (!notebook) {
    notebook = yield enClient.createNotebook(name)
  }
  return notebook
}

function* getEvernoteClient() {
  if (evernoteClient) {
    return evernoteClient
  }

  const config = yield readConfig()
  evernoteClient = new EvernoteClient(config)
  return evernoteClient
}

function* getDB() {
  const dbPath = yield getDbPath()
  return new DB(dbPath)
}

function parseNoteInfo(tokens = []) {
  const preTitleIndex = tokens.findIndex(token => token.type === 'heading_open')
  const titleToken = preTitleIndex >= 0 ? tokens[preTitleIndex + 1] : null
  const noteTitle = titleToken ? titleToken.content : 'untitled'

  let notebookName = null
  let tagNames = null
  const notebookToken = tokens.find(token => /^ *@\(.+\)(\[.+\])?$/.test(token.content))
  debug('notebookToken: %o', notebookToken)
  if (notebookToken) {
    const matched = notebookToken.content.trim().match(/^ *@\((.+)\)(\[(.+)\])?$/)
    notebookName = matched[1]
    debug('notebookName: %s', notebookName)

    tagNames = matched[3]
    if (tagNames) {
      tagNames = tagNames
        .split('|')
        .map(s => s.trim())
        .filter(s => !!s)
    }
    debug('tagNames: %o', tagNames)
  }

  return { noteTitle, notebookName, tagNames }
}

function* generateHtml(tokens = []) {
  const markedHtml = remarkable.renderer.render(tokens, remarkable.options)
  debug('markedHtml: %s', markedHtml)

  // Html with styles
  const htmlStyles = yield [
    fileUtils.readFile(`${__dirname}/../themes/markdown/github.css`),
    fileUtils.readFile(`${__dirname}/../themes/highlight/gruvbox-dark.css`),
  ]
  const styleHtml = `<style>${htmlStyles[0]}${htmlStyles[1]}</style>` +
    `<div class="markdown-body">${markedHtml}</div>`

  // Make html classes to inline styles
  const inlineStyleHtml = yield inlineCss(styleHtml, {
    url: '/',
    xmlMode: true,
    removeStyleTags: true,
    removeHtmlSelectors: true,
  })
  return inlineStyleHtml
}
