const path = require('path')
const crypto = require('crypto')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const Promise = require('bluebird')
const cheerio = require('cheerio')
const hljs = require('highlight.js')
const inlineCss = require('inline-css')
const MarkdownIt = require('markdown-it')
const mdSub = require('markdown-it-sub')
const mdSup = require('markdown-it-sup')
const mdEmoji = require('markdown-it-emoji')
const mdMathJax = require('markdown-it-mathjax')
const mdEnmlTodo = require('markdown-it-enml-todo')
const mathJax = require('mathjax-node/lib/mj-page')
const svg2png = require('svg2png')
const debug = require('debug')('evermark')
const {
  Evernote,
  EvernoteClient,
  OBJECT_NOT_FOUND,
  DEFAULT_RESOURCE_TYPE,
  RESOURCE_TYPES
} = require('./EvernoteClient')
const EvermarkError = require('./EvermarkError')
const Db = require('./db')
const fileUtils = require('./fileUtils')
const config = require('./config')

const { APP_NAME } = config

const NOTE_PATH = 'notes'
const NOTE_MATH_PATH = `${NOTE_PATH}/maths`
const NOTE_DIAGRAM_PATH = `${NOTE_PATH}/diagrams`
const MARKDOWN_THEME_PATH = path.join(__dirname, '../themes')
const HIGHLIGHT_THEME_PATH = path.join(__dirname, '../node_modules/highlight.js/styles')

const DEFAULT_HIGHLIGHT_THEME = 'github'
const MATH_EX_PX_RATIO = 8.27

// Init mathJax api
mathJax.start()

class Evermark {
  constructor(workDir = `.${path.sep}`, options = {}) {
    this.workDir = workDir
    debug('workDir:', this.workDir)

    const md = new MarkdownIt({
      html: true, // Enable HTML tags in source
      linkify: true, // Autoconvert URL-like text to links

      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed
      highlight(code, lang) {
        if (code.match(/^graph/) || code.match(/^sequenceDiagram/) || code.match(/^gantt/)) {
          return `<div class="mermaid">${code}</div>`
        }

        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="hljs"><code>${hljs.highlight(lang, code, true).value}</code></pre>`
          } catch (err) {
            // Ignore error
          }
        }

        return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`
      },
      ...options
    })

    // Use some plugins
    md.use(mdSub)
      .use(mdSup)
      .use(mdEmoji)
      .use(mdMathJax)
      .use(mdEnmlTodo)

    // Add inline code class
    const inlineCodeRule = md.renderer.rules.code_inline
    md.renderer.rules.code_inline = (...args) => {
      const result = inlineCodeRule.call(md, ...args)
      return result.replace('<code>', '<code class="inline">')
    }

    this.md = md
  }

  async createLocalNote(title) {
    const configDir = await this.getConfigDir()

    // Remove some chars from title
    const filename = title.replace(/(\/|-)+/g, '-').replace(/^-|-$/g, '')

    // Get unique note path and create note file
    const notePath = await fileUtils.uniquePath(path.join(configDir, `${NOTE_PATH}/${filename}.md`))
    await fileUtils.writeFile(notePath, `# ${title}\n`)

    return notePath
  }

  async publishNote(notePath) {
    let content

    try {
      content = await fileUtils.readFile(notePath)
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new EvermarkError(`${notePath} does not exist`)
      }

      throw err
    }

    return this.saveNote(notePath, content)
  }

  async unpublishNote(notePath) {
    const db = await this.getDb()
    const Note = await db.model('notes', {
      guid: { type: String, required: true },
      path: { type: String, required: true },
      created: { type: Date, default: Date.now }
    })

    const { absolutePath, relativePath } = await this.getNotePathInfo(notePath)
    const note = Note.findOne({ path: relativePath })

    if (!note) {
      throw new EvermarkError(`${notePath} is not a published note`)
    }

    await this.expungeNote(note.guid)
    await Note.remove({ path: relativePath })
    await db.save()
    return absolutePath
  }

  async saveNote(notePath, content) {
    const note = new Evernote.Types.Note()

    const noteAttrs = new Evernote.Types.NoteAttributes()
    noteAttrs.source = APP_NAME
    noteAttrs.sourceApplication = APP_NAME
    noteAttrs.contentClass = APP_NAME // Make the note read-only
    note.attributes = noteAttrs

    const { absolutePath, relativePath } = await this.getNotePathInfo(notePath)
    note.absolutePath = absolutePath
    note.relativePath = relativePath

    const tokens = this.md.parse(content, {})

    const noteInfo = Evermark.parseNoteInfo(tokens)
    note.title = noteInfo.noteTitle

    if (noteInfo.tagNames && noteInfo.tagNames.length) {
      note.tagNames = noteInfo.tagNames
    }

    if (noteInfo.notebookName) {
      const createdNotebook = await this.createNotebookIfPossible(noteInfo.notebookName)
      note.notebookGuid = createdNotebook.guid
    }

    // The content of an Evernote note is represented using Evernote Markup Language
    // (ENML). The full ENML specification can be found in the Evernote API Overview
    // at http://dev.evernote.com/documentation/cloud/chapters/ENML.php
    const htmlContent = await this.generateHtml(note, tokens)
    note.content =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">' +
      `<en-note>${htmlContent}</en-note>`

    return this.doSaveNote(note)
  }

  async doSaveNote(note) {
    const db = await this.getDb()
    const Note = await db.model('notes', {
      guid: { type: String, required: true },
      path: { type: String, required: true },
      created: { type: Date, default: Date.now }
    })

    let isLocalUpdate = false
    const dbNote = Note.findOne({ path: note.relativePath })
    if (dbNote) {
      try {
        note.guid = dbNote.guid
        const updatedNote = await this.updateNote(note)
        updatedNote.absolutePath = note.absolutePath
        return updatedNote
      } catch (err) {
        if (err.code !== OBJECT_NOT_FOUND) {
          throw err
        }

        delete note.guid
        isLocalUpdate = true
      }
    }

    const createdNote = await this.createNote(note)
    createdNote.absolutePath = note.absolutePath

    if (isLocalUpdate) {
      await Note.update(
        { path: note.relativePath },
        { guid: createdNote.guid, path: note.relativePath }
      )
    } else {
      await Note.insert({ guid: createdNote.guid, path: note.relativePath })
    }
    await db.save()

    return createdNote
  }

  async createNotebookIfPossible(name) {
    const notebooks = await this.listNotebooks()
    let notebook = notebooks.find(nb => nb.name === name)
    if (!notebook) {
      notebook = await this.createNotebook(name)
    }
    return notebook
  }

  listNotebooks() {
    return this.getEvernoteClient().then(client => client.listNotebooks())
  }

  createNotebook(name) {
    return this.getEvernoteClient().then(client => client.createNotebook(name))
  }

  createNote(note) {
    return this.getEvernoteClient().then(client => client.createNote(note))
  }

  updateNote(note) {
    return this.getEvernoteClient().then(client => client.updateNote(note))
  }

  expungeNote(guid) {
    return this.getEvernoteClient().then(client => client.expungeNote(guid))
  }

  getEvernoteClient() {
    if (!this.evernoteClient) {
      this.evernoteClient = this.getConfig().then(options => new EvernoteClient(options))
    }
    return this.evernoteClient
  }

  getConfig() {
    if (!this.config) {
      this.config = config.readConfig(this.workDir).then(conf => conf)
    }
    return this.config
  }

  async getConfigDir() {
    const configPath = await config.getConfigPath(this.workDir)
    return path.dirname(configPath)
  }

  getDb() {
    if (!this.db) {
      this.db = config.getDbPath(this.workDir).then(dbPath => new Db(dbPath))
    }
    return this.db
  }

  async getNotePathInfo(notePath) {
    const configDir = await this.getConfigDir()

    const absolutePath = path.isAbsolute(notePath) ? notePath : path.resolve(notePath)
    const relativePath = path.relative(configDir, absolutePath).replace(/\\/g, '/') // Fix windows issue

    debug('absolute notePath: %s', absolutePath)
    debug('relative notePath: %s', relativePath)

    return { absolutePath, relativePath }
  }

  static parseNoteInfo(tokens = []) {
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

  async generateHtml(note, tokens) {
    const markedHtml = this.md.renderer.render(tokens, this.md.options)
    debug('markedHtml: %s', markedHtml)

    const $ = cheerio.load(markedHtml)
    await this.processDiagrams($)
    const mathStyles = await this.processMathEquations($)
    await this.processStyles($, mathStyles)
    await this.attachResources($, note)

    // ENML is a superset of XHTML, so change html to xhtml
    const finalXhtml = $.xml()
    debug('finalXhtml: %s', finalXhtml)
    return finalXhtml
  }

  async processDiagrams($) {
    const mermaids = []
    const $mermaids = $('.mermaid')
    $mermaids.each((i, e) => {
      mermaids.push($(e).text())
    })

    const mmdImgs = await Promise.map(mermaids, async mermaid => {
      const mmdFile = path.join(this.workDir, NOTE_DIAGRAM_PATH, `${Evermark.genHash(mermaid)}.mmd`)
      const mmdPng = mmdFile.replace(/\.mmd/, '.png')
      await fileUtils.writeFile(mmdFile, mermaid)

      try {
        const mmdCss = path.join(__dirname, 'mermaid.css')
        const { stdout, stderr } = await exec(
          `node_modules/mermaid.cli/index.bundle.js -i ${mmdFile} -o ${mmdPng} -w 1280 -C ${mmdCss}`
        )
        debug('mermaid.cli stdout:', stdout)
        if (stderr) {
          throw new Error(`mermaid.cli error: ${stderr}`)
        }
      } catch (e) {
        throw new Error(`mermaid.cli error: ${e}`)
      }

      // const srcData = await fileUtils.readFile(mmdSvg)
      // const destData = await svg2png(srcData)
      // const mmdPng = mmdFile.replace(/\.mmd/, '.png')
      // await fileUtils.writeFile(mmdPng, destData)
      debug('mmdPng:', mmdPng)

      return `${mmdPng.slice(path.join(this.workDir, NOTE_PATH).length + 1)}`
    })
    debug('mermaid images:', mmdImgs)

    // Replace mermaid codes with mermaid diagrams
    $mermaids.each((i, e) => {
      $(e).replaceWith(`<img src="${mmdImgs[i]}" alt="mermaid diagram" style="max-width: 80%;">`)
    })
  }

  async processMathEquations($) {
    const html = await new Promise((resolve, reject) => {
      mathJax.typeset(
        {
          html: $.html(),
          renderer: 'SVG'
        },
        result => {
          if (result.errors) {
            reject(result.errors)
          } else {
            resolve(result.html)
          }
        }
      )
    })
    $.root().html(html)

    const $mathStyles = $('#MathJax_SVG_styles')
    const $mathSvgDefs = $('#MathJax_SVG_glyphs').parent()
    const mathStyles = $mathStyles.text()
    const mathSvgGlyphs = $mathSvgDefs.html()
    $mathStyles.remove()
    $mathSvgDefs.remove()

    const mathSvgs = []
    const $svgs = $('svg')
    $svgs.each((i, e) => {
      mathSvgs.push({
        data: $(e)
          .prepend(mathSvgGlyphs)
          .parent()
          .html(),
        width: parseInt($(e).attr('width'), 10) * MATH_EX_PX_RATIO,
        height: parseInt($(e).attr('height'), 10) * MATH_EX_PX_RATIO
      })
    })

    const mathImgs = await Promise.map(mathSvgs, async svg => {
      const img = path.join(this.workDir, NOTE_MATH_PATH, `${Evermark.genHash(svg.data)}.png`)
      await svg2png(Buffer.from(svg.data), { width: svg.width * 2, height: svg.height * 2 }).then(
        buffer => fileUtils.writeFile(img, buffer)
      )
      return {
        src: `${img.slice(path.join(this.workDir, NOTE_PATH).length + 1)}`,
        width: svg.width,
        height: svg.height
      }
    })
    debug('mathImgs:', mathImgs)

    // Replace math svgs with math images
    $svgs.each((i, e) => {
      $(e).replaceWith(
        `<img src="${mathImgs[i].src}" alt="math equation"` +
          `width="${mathImgs[i].width}" height="${mathImgs[i].height}">`
      )
    })

    return mathStyles
  }

  async processStyles($, mathStyles) {
    // Get highlight theme from configuration
    const conf = await this.getConfig()
    const highlightTheme = conf.highlight || DEFAULT_HIGHLIGHT_THEME

    // Process html styles
    const styles = await Promise.all([
      mathStyles,
      fileUtils.readFile(path.join(MARKDOWN_THEME_PATH, 'github.css')),
      fileUtils.readFile(path.join(HIGHLIGHT_THEME_PATH, `${highlightTheme}.css`))
    ])
    const styleHtml =
      `<style>${styles.join('')}</style>` + `<div class="markdown-body">${$.html()}</div>`
    debug('styleHtml: %s', styleHtml)
    $.root().html(styleHtml)

    // Change html classes to inline styles
    const inlineStyleHtml = await inlineCss($.html(), {
      url: '/',
      removeStyleTags: true,
      removeHtmlSelectors: true
    })
    $.root().html(inlineStyleHtml)
    $('en-todo').removeAttr('style')
  }

  async attachResources($, note) {
    const configDir = await this.getConfigDir()

    const imgs = $('img')
      .toArray()
      .filter(img => !/^.+:\/\//.test(img.attribs.src))
    note.resources = await Promise.map(imgs, async img => {
      const src = decodeURI(img.attribs.src)
      delete img.attribs.src
      img.name = 'en-media'

      const extname = path.extname(src)
      const imgType = RESOURCE_TYPES[extname] || DEFAULT_RESOURCE_TYPE
      img.attribs.type = imgType

      const image = await fileUtils.readFile(path.join(configDir, `${NOTE_PATH}/${src}`), null)
      img.attribs.hash = Evermark.genHash(image)

      const resource = new Evernote.Types.Resource()
      resource.mime = 'image/jpeg'
      resource.data = new Evernote.Types.Data()
      resource.data.body = image
      resource.data.bodyHash = image.toString('base64')
      resource.data.size = image.length
      return resource
    })
  }

  static genHash(data) {
    const md5 = crypto.createHash('md5')
    md5.update(data)
    return md5.digest('hex')
  }
}

module.exports = Evermark
