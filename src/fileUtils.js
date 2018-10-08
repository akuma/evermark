/**
 * This file contains common utility methods manipulating files and directories.
 */

const path = require('path')
const fs = require('fs-extra')

/**
 * 从指定的文件数据。
 *
 * Read data from the specified file.
 */
function readFile(file, encoding = 'utf8') {
  return fs.readFile(file, encoding)
}

/**
 * 根据文件名递归查找文件，直至到最顶层目录为止。
 *
 * Recursively find files by file name, until up to the top level directory.
 */
function searchFile(filename, dir = `.${path.sep}`) {
  const aDir = dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`
  const currentPath = path.resolve(aDir, filename)
  return fs.pathExists(currentPath).then(isExists => {
    if (isExists) {
      return currentPath
    }

    const nextPath = path.resolve(`${aDir}..${path.sep}`, filename)
    if (nextPath === currentPath) {
      return null
    }

    return searchFile(filename, `${aDir}..${path.sep}`)
  })
}

/**
 * 获取目录下唯一的文件名，如果同名文件已经存在，则自动添加数字编号。
 * 返回文件名的全路径，例如：/test/foo-1.txt，/test/bar-2.txt。
 *
 * Get a unique file name directory, if the file already exists with the same
 * name, it is automatically added figures.
 * It returns the full path of the file name, for example:
 * /test/foo-1.txt,/test/bar-2.txt.
 */
function uniquePath(file) {
  const absolutePath = path.resolve(file)
  const dirname = path.dirname(absolutePath)
  const extname = path.extname(absolutePath)
  const basename = path.basename(file, extname)
  const filenameRegex = new RegExp(`${basename}-(\\d+)${extname}`)

  return fs
    .pathExists(absolutePath)
    .then(exist => (exist ? fs.readdir(dirname) : absolutePath))
    .then(result => {
      if (Array.isArray(result) && result.length) {
        let maxSerial = 0

        const files = result.filter(name => filenameRegex.test(name)).sort((a, b) => {
          const an = a.replace(filenameRegex, '$1')
          const bn = b.replace(filenameRegex, '$1')
          return parseInt(an, 10) - parseInt(bn, 10)
        })
        if (files.length) {
          const maxSerialFilename = files[files.length - 1]
          maxSerial = parseInt(maxSerialFilename.replace(filenameRegex, '$1'), 10)
        }

        return path.join(dirname, `${basename}-${maxSerial + 1}${extname}`)
      }

      return absolutePath
    })
}

module.exports = {
  exists: fs.pathExists,
  copy: fs.copy,
  remove: fs.remove,
  ensureDir: fs.ensureDir,
  ensureFile: fs.ensureFile,
  readdir: fs.readdir,
  readFile,
  writeFile: fs.outputFile,
  searchFile,
  uniquePath
}
