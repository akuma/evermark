#!/usr/bin/env node
/* eslint no-console: 0 */
/* eslint no-param-reassign: 0 */
/* eslint global-require: 0 */

const DEV = process.env.NODE_ENV === 'development'
if (DEV) {
  require('babel-register')
}
require('babel-polyfill')

const os = require('os')
const path = require('path')
const co = require('co')
const ora = require('ora')
const chalk = require('chalk')
const program = require('commander')
const pkg = require('../package.json')

const fileUtils = require(DEV ? '../src/fileUtils' : '../lib/fileUtils').default
const { Evermark, config } = require(DEV ? '../src' : '../lib')

const fs = fileUtils.fs
const magenta = chalk.magenta

program
  .version(pkg.version)
  .usage('[command]')
  .on('*', () => {
    program.help()
  })

const commands = {
  init: {
    cmd: 'init [destination]',
    desc: 'Create a new Evermark folder at the specified path or the current directory.',
    action: init,
    args: {
      '[destination]': 'Folder path. Initialize in current folder if not specified',
    },
  },
  config: {
    cmd: 'config [name] [value]',
    desc: 'Get or set configurations.',
    action: getOrSetConfig,
    args: {
      '[name]': 'Setting name. Leave it blank if you want to show all configurations.',
      '[value]': 'New value of a setting. ' +
        'Leave it blank if you want to show a single configuration.',
    },
  },
  new: {
    cmd: 'new <title>',
    desc: 'Create a new local note.',
    action: newNote,
    args: {
      '<title>': 'Note title. Wrap it with quotations to escape.',
    },
  },
  publish: {
    cmd: 'publish <file_or_directory>',
    desc: 'Publish local note(s) to Evernote.',
    action: publishNote,
    args: {
      '<file_or_directory>': 'Note file path or note directory path.',
    },
  },
  unpublish: {
    cmd: 'unpublish <file_or_directory>',
    desc: 'Remove note(s) from Evernote.',
    action: unpublish,
    args: {
      '<file_or_directory>': 'Note file path or note directory path.',
    },
  },
  help: {
    cmd: 'help [command]',
    desc: 'Get help on a command.',
    action: showProgramHelp,
    args: {
      '[command]': 'Command name.',
    },
  },
}

Object.keys(commands).forEach(cmd => {
  const command = commands[cmd]
  const prog = program
    .command(command.cmd)
    .description(command.desc)

  if (command.action) {
    prog.action(command.action)
  }
})

program.parse(process.argv)

if (process.argv.length === 2) {
  program.help()
}

function bold(command) {
  return chalk.bold(command)
}

function tildify(str) {
  const home = os.homedir()
  return magenta((str.indexOf(home) === 0 ? str.replace(home, '~') : str))
}

function info(message) {
  console.log(`${chalk.green('INFO')} `, message)
}

function error(message) {
  console.error(`${chalk.red('ERROR')} `, message)
}

function printCommandHelp(command, desc, args) {
  args = args || {}

  console.log()
  console.log(`  Usage: evermark ${command} ${Object.keys(args).map(k => k).join(' ')}`)
  console.log()
  console.log('  Description:')
  console.log(`  ${desc}`)

  const argDesces = Object.keys(args)
    .map(k => `    ${bold(k.substring(1, k.length - 1))}\t${args[k]}`)
  if (argDesces.length) {
    console.log()
    console.log('  Arguments:')
    argDesces.map(s => console.log(s))
  }

  console.log()
}

function showProgramHelp(cmd) {
  const command = commands[cmd]
  if (command) {
    printCommandHelp(cmd, command.desc, command.args)
  } else {
    program.help()
  }
}

function exeCmd(fn, spinnerEnable = false) {
  const spinner = spinnerEnable ? ora().start() : null

  co(function* exe() {
    yield fn(spinner)

    if (spinner) {
      spinner.stop()
    }
  }).catch(err => {
    if (spinner) {
      spinner.stop()
    }

    if (err.name === 'EvermarkError') {
      error(err.message)
    } else {
      error(err)
    }

    process.exit(1)
  })
}

function init(destination) {
  exeCmd(function* fn() {
    yield config.initConfig(destination)
    info('Evermark folder has been initialized.\n      ' +
        'Update the token in "evermark.json" then you can add some notes.')
  })
}

function getOrSetConfig(name, value) {
  exeCmd(function* fn() {
    if (!name) {
      const conf = yield config.readConfig()
      info(conf)
      return
    }

    if (!value) {
      const val = yield config.getConfig(name)
      info(`${name}: ${val}`)
      return
    }

    const conf = yield config.setConfig(name, value)
    info(`Updated config:\n\n${conf}`)
  })
}

function newNote(title) {
  exeCmd(function* fn() {
    const evermark = new Evermark()
    const notePath = yield evermark.createLocalNote(title)
    info(`Created local note: ${tildify(notePath)}`)
  })
}

function publishNote(fileOrDir) {
  exeCmd(function* fn() {
    const evermark = new Evermark()

    const isDirectory = (yield fs.statAsync(fileOrDir)).isDirectory()
    if (isDirectory) {
      const files = (yield fs.readdirAsync(fileOrDir))
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(fileOrDir, f))
      const notes = yield Promise.all(files.map(f => evermark.publishNote(f)))

      info(`Published ${notes.length} note(s).`)
      notes.forEach(note => info(`Published note: ${tildify(note.absolutePath)}`))
    } else {
      const note = yield evermark.publishNote(fileOrDir)
      info(`Published note: ${tildify(note.absolutePath)}`)
    }
  }, true)
}

function unpublish(fileOrDir) {
  exeCmd(function* fn() {
    const evermark = new Evermark()

    const isDirectory = (yield fs.statAsync(fileOrDir)).isDirectory()
    if (isDirectory) {
      const files = (yield fs.readdirAsync(fileOrDir))
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(fileOrDir, f))
      const notePaths = yield Promise.all(files.map(f => evermark.unpublishNote(f)))

      info(`Unpublished ${notePaths.length} note(s).`)
      notePaths.forEach(notePath => info(`Unpublished note: ${tildify(notePath)}`))
    } else {
      const notePath = yield evermark.unpublishNote(fileOrDir)
      info(`Unpublished note: ${tildify(notePath)}`)
    }
  }, true)
}
