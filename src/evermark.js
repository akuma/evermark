import 'babel-polyfill'
import path from 'path'
import chalk from 'chalk'
import marked from 'marked'
import hljs from 'highlight.js'
import inlineCss from 'inline-css'
import { Evernote } from 'evernote'
import fileUtils from './fileUtils'
import EvernoteClient from './evernote'
import db from './db'
import { info } from './logger'
import { getConfigPath, readConfig } from './config'

let evernoteClient = null
const magenta = chalk.magenta
const debug = require('debug')('evermark')

export function* createLocalNote(title) {
  const configPath = yield getConfigPath()
  if (!configPath) {
    return
  }

  const noteDir = path.dirname(configPath)
  const notePath = `${noteDir}/notes/${title}.md`
  const isExists = yield fileUtils.exists(notePath)
  if (isExists) {
    throw new Error(`Note with title ${title} is exists.`)
  }

  yield fileUtils.ensureFile(notePath)
  yield fileUtils.writeFile(notePath, `# ${title}\n`)
  info(`Successfully created local note: ${magenta(notePath)}`)
}

export function* publishNote(notePath) {
  const content = yield fileUtils.readFile(notePath)
  return yield saveNote(content, notePath)
}

function* createNotebookIfPossible(name) {
  const enClient = yield getEvernoteClient()
  const notebooks = yield enClient.listNotebooks()
  let notebook = notebooks.find(nb => nb.name === name)
  if (!notebook) {
    notebook = yield enClient.createNotebook(name)
    info(`Successfully created notebook: ${magenta(notebook.name)}`)
  }
  return notebook
}

function* saveNote(content, notePath) {
  const note = new Evernote.Note()

  const noteInfo = parseNoteInfo(content)
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
  const htmlContent = yield generateHtml(content)
  note.content = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">' +
    `<en-note>${htmlContent}</en-note>`

  return yield doSaveNote(note, notePath)
}

function* doSaveNote(note, notePath) {
  const enClient = yield getEvernoteClient()
  const Note = yield getNoteModel()

  const dbNote = Note.findOne({ path: notePath })
  if (dbNote) {
    const aNote = note
    aNote.guid = dbNote.guid
    const updatedNote = yield enClient.updateNote(aNote)
    info(`Successfully updated note: ${magenta(updatedNote.title)}`)
    return updatedNote
  }

  const createdNote = yield enClient.createNote(note)
  yield Note.insertOne({ guid: createdNote.guid, path: notePath })
  yield db.save()
  info(`Successfully created note: ${magenta(createdNote.title)}`)
  return createdNote
}

function* getEvernoteClient() {
  if (evernoteClient) {
    return evernoteClient
  }

  const config = yield readConfig()
  evernoteClient = new EvernoteClient(config)
  return evernoteClient
}

function getNoteModel() {
  return db.model('notes', {
    guid: String,
    path: String,
    created: { type: Date, default: Date.now },
  })
}

function parseNoteInfo(content) {
  const tokens = marked.lexer(content)
  const titleToken = tokens.find(token => token.type === 'heading')
  const noteTitle = titleToken ? titleToken.text : 'untitled'

  let notebookName = null
  let tagNames = null
  const notebookToken = tokens.find(token => /^ *@\(.+\)(\[.+\])?$/.test(token.text))
  debug('notebookToken: %o', notebookToken)
  if (notebookToken) {
    const matched = notebookToken.text.trim().match(/^ *@\((.+)\)(\[(.+)\])?$/)
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

function* generateHtml(markdown) {
  const renderer = new marked.Renderer()
  renderer.code = (code, language) => {
    let hljsCode = code
    try {
      hljsCode = hljs.highlight(language, code).value
    } catch (e) {
      // Ignore
    }
    return `<pre class="hljs"><code class="${language}">${hljsCode}</code></pre>`
  }
  renderer.codespan = code => `<code class="inline">${code}</code>`

  const htmlStyles = yield [
    fileUtils.readFile(`${__dirname}/../themes/markdown/github.css`),
    fileUtils.readFile(`${__dirname}/../themes/highlight/gruvbox-dark.css`),
  ]

  // Markdown to html
  const markedHtml = yield new Promise((resolve, reject) => (
    marked(markdown, {
      renderer,
      xhtml: true,
      breaks: true,
      sanitize: true,
    }, (err, result) => {
      if (err) return reject(err)
      return resolve(result)
    })
  ))

  // Html with styles
  const styledHtml = `<style>${htmlStyles[0]}${htmlStyles[1]}</style>` +
    `<div class="markdown-body">${markedHtml}</div>`

  // Make html classes to inline styles
  return inlineCss(styledHtml, {
    url: '/',
    xmlMode: true,
    removeStyleTags: true,
    removeHtmlSelectors: true,
  })
}
