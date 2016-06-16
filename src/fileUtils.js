/**
 * 此文件包含操作文件、目录的常用工具方法。
 */

import path from 'path'
import fsExtra from 'fs-extra'
import Promise from 'bluebird'

const fs = Promise.promisifyAll(fsExtra)

/**
 * 验证文件或目录是否可访问。
 */
export function exists(file) {
  return new Promise(resolve => {
    fs.access(file, fs.F_OK, err => resolve(!err))
  })
}

/**
 * 删除指定的文件或目录。
 */
export function remove(file) {
  return fs.removeAsync(file)
}

/**
 * 确保指定目录存在，如果目录不存在会自动创建。
 */
export function ensureDir(dir) {
  return fs.ensureDirAsync(dir)
}

/**
 * 确保指定文件存在，如果文件不存在会自动创建。
 */
export function ensureFile(file) {
  return fs.ensureFileAsync(file)
}

/**
 * 写数据到指定的文件，如果文件不存在会自动创建。
 */
export function readFile(file, encoding = 'utf8') {
  return fs.readFileAsync(file, encoding)
}

/**
 * 写数据到指定的文件，如果文件不存在会自动创建。
 */
export function writeFile(file, data) {
  return fs.outputFileAsync(file, data)
}

/**
 * 根据文件名递归查找文件，直至到最顶层目录为止。
 */
export function searchFile(filename, dir = './') {
  const aDir = dir.endsWith('/') ? dir : `${dir}/`
  const currentPath = path.resolve(aDir, filename)
  return exists(currentPath).then(isExists => {
    if (isExists) {
      return currentPath
    }

    const nextPath = path.resolve(`${aDir}../`, filename)
    if (nextPath === currentPath) {
      return null
    }

    return searchFile(filename, `${aDir}../`)
  })
}

export default {
  exists,
  remove,
  ensureDir,
  ensureFile,
  readFile,
  writeFile,
  searchFile,
}
