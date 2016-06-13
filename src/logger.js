/* eslint no-console: 0 */

const chalk = require('chalk')

export function info(message) {
  console.log(`${chalk.green('INFO')} `, message)
}

export function error(message) {
  console.log(`${chalk.red('ERROR')} `, message)
}

export default {
  info,
  error,
}
