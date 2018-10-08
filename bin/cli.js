#!/usr/bin/env node

const os = require('os')
const path = require('path')
const readline = require('readline')
const opn = require('opn')
const ora = require('ora')
const chalk = require('chalk')
const program = require('commander')
const pkg = require('../package.json')
const fileUtils = require('../src/fileUtils')
const { Evermark, EvermarkError, config } = require('../src')

const DEV_TOKEN_URL_YINXIANG = 'https://app.yinxiang.com/api/DeveloperToken.action'
const DEV_TOKEN_URL_EVERNOTE = 'https://www.evernote.com/api/DeveloperToken.action'

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
      '[destination]': 'Folder path. Initialize in current folder if not specified'
    }
  },
  config: {
    cmd: 'config [name] [value]',
    desc: 'Get or set configurations.',
    action: getOrSetConfig,
    args: {
      '[name]': 'Setting name. Leave it blank if you want to show all configurations.',
      '[value]':
        'New value of a setting. ' + 'Leave it blank if you want to show a single configuration.'
    }
  },
  new: {
    cmd: 'new <title>',
    desc: 'Create a new local note.',
    action: newNote,
    args: {
      '<title>': 'Note title. Wrap it with quotations to escape.'
    }
  },
  publish: {
    cmd: 'publish <file_or_directory>',
    desc: 'Publish local note(s) to Evernote.',
    action: publishNote,
    args: {
      '<file_or_directory>': 'Note file path or note directory path.'
    }
  },
  unpublish: {
    cmd: 'unpublish <file_or_directory>',
    desc: 'Remove note(s) from Evernote.',
    action: unpublish,
    args: {
      '<file_or_directory>': 'Note file path or note directory path.'
    }
  },
  help: {
    cmd: 'help [command]',
    desc: 'Get help on a command.',
    action: showProgramHelp,
    args: {
      '[command]': 'Command name.'
    }
  }
}

Object.keys(commands).forEach(cmd => {
  const command = commands[cmd]
  const prog = program.command(command.cmd).description(command.desc)

  if (command.action) {
    prog.action(command.action)
  }
})

program.parse(process.argv)

if (program.args.length === 0) {
  program.help()
}

function bold(command) {
  return chalk.bold(command)
}

function tildify(str) {
  const home = os.homedir()
  return magenta(str.indexOf(home) === 0 ? str.replace(home, '~') : str)
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
  console.log(
    `  Usage: evermark ${command} ${Object.keys(args)
      .map(k => k)
      .join(' ')}`
  )
  console.log()
  console.log('  Description:')
  console.log(`  ${desc}`)

  const argDesces = Object.keys(args).map(
    k => `    ${bold(k.substring(1, k.length - 1))}\t${args[k]}`
  )
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
  ;(async () => {
    await fn(spinner)

    if (spinner) {
      spinner.stop()
    }
  })().catch(err => {
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
  exeCmd(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const china = await new Promise(resolve => {
      rl.question('Do you use (E)vernote International or (Y)inxiang Biji? [E]/Y ', answer => {
        rl.pause()
        resolve(/y|Y/.test(answer))
      })
    })

    const devTokenUrl = china ? DEV_TOKEN_URL_YINXIANG : DEV_TOKEN_URL_EVERNOTE
    await opn(devTokenUrl, { wait: false })

    let token = null
    while (!token || !token.trim()) {
      token = await new Promise(resolve => {
        const appName = china ? 'Yinxiang Biji' : 'Evernote International'
        rl.question(`Please input your ${appName} developer token:\n`, answer => {
          rl.close()
          resolve(answer)
        })
      })
    }

    await config.initConfig(destination, { token, china })

    info('Evermark folder has been initialized.')
  })
}

function getOrSetConfig(name, value) {
  exeCmd(async () => {
    if (!name) {
      const conf = await config.readConfig()
      info(conf)
      return
    }

    if (!value) {
      const val = await config.getConfig(name)
      info(`${name}: ${val}`)
      return
    }

    const conf = await config.setConfig(name, value)
    info(`Updated config:\n\n${conf}`)
  })
}

function newNote(title) {
  exeCmd(async () => {
    const evermark = new Evermark()
    const notePath = await evermark.createLocalNote(title)
    info(`Created local note: ${tildify(notePath)}`)
  })
}

function publishNote(fileOrDir) {
  exeCmd(async () => {
    const evermark = new Evermark()

    const isDir = await isDirectory(fileOrDir)
    if (isDir) {
      const files = (await fileUtils.readdir(fileOrDir))
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(fileOrDir, f))
      const notes = await Promise.all(files.map(f => evermark.publishNote(f)))

      info(`Published ${notes.length} note(s).`)
      notes.forEach(note => info(`Published note: ${tildify(note.absolutePath)}`))
    } else {
      const note = await evermark.publishNote(fileOrDir)
      info(`Published note: ${tildify(note.absolutePath)}`)
    }
  }, true)
}

function unpublish(fileOrDir) {
  exeCmd(async () => {
    const evermark = new Evermark()

    const isDir = await isDirectory(fileOrDir)
    if (isDir) {
      const files = (await fileUtils.readdir(fileOrDir))
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(fileOrDir, f))
      const notePaths = await Promise.all(files.map(f => evermark.unpublishNote(f)))

      info(`Unpublished ${notePaths.length} note(s).`)
      notePaths.forEach(notePath => info(`Unpublished note: ${tildify(notePath)}`))
    } else {
      const notePath = await evermark.unpublishNote(fileOrDir)
      info(`Unpublished note: ${tildify(notePath)}`)
    }
  }, true)
}

async function isDirectory(fileOrDir) {
  let isDir = false
  try {
    isDir = (await fileUtils.stat(fileOrDir)).isDirectory()
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new EvermarkError(`${fileOrDir} does not exist`)
    }
  }
  return isDir
}
