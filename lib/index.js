const url = require('url')
const path = require('path')

const got = require('got')
const uuid = require('uuid')
const qiniu = require('qiniu')
const moment = require('moment')
const StorageBase = require('ghost-storage-base')

/**
 * Compile an ES6 template literals to a Template function
 * @param {string} source ES6 template literals
 */
const compile = source => {
  return context => {
    /* eslint-disable no-new-func */
    const props = Object.keys(context).join(', ')
    return new Function(`{ ${props} }`, `return \`${source}\``)(context)
  }
}

/**
 * Get path format context
 */
const getPathContext = original => {
  const date = moment()
  return {
    year: date.format('YYYY'),
    month: date.format('MM'),
    day: date.format('DD'),
    hour: date.format('HH'),
    timestamp: date.format('x'),
    random: Math.random().toString().substr(-8),
    uuid: uuid(),
    ext: path.extname(original),
    name: path.basename(original, path.extname(original))
  }
}

class QiniuStorage extends StorageBase {
  /**
   * QiniuStorage constructor
   * @param  {Object} options Options in config file
   * @return {QiniuStorage} QiniuStorage instance
   * @example
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/adapters/storage/index.js#L72
   */
  constructor (options) {
    super()

    /* eslint-disable no-template-curly-in-string */
    let { accessKey, secretKey, bucket, domain, format = '${year}/${month}/${name}${ext}' } = options

    if (!(bucket && accessKey && secretKey && domain && format)) {
      throw new Error('Missing necessary configuration options')
    }

    format = format.toLowerCase()

    const tags = Object.keys(getPathContext('zce.txt'))
    const unknownTags = format.match(/(?<=\$\{)\w+(?=\})/g).filter(i => !tags.includes(i))
    if (unknownTags.length) {
      throw new Error('Invalid format: ' + unknownTags.map(i => `\${${i}}`) + ' is unknown variable')
    }

    this.accessKey = accessKey
    this.secretKey = secretKey
    this.bucket = bucket
    this.domain = domain

    this.dirFormat = path.dirname(format)
    this.nameFormat = path.basename(format)
  }

  /**
   * Save file to storage
   * @param {Object} file An file object with properties name and path
   * @param {string} targetDir A path to where to store the file [optional]
   * @example
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/api/v2/upload.js#L15
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/api/v2/upload.js#L25
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/data/importer/importers/image.js#L70
   */
  save (file, targetDir) {
    const context = getPathContext(file.name)

    const upload = key => new Promise((resolve, reject) => {
      const mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey)
      const policy = new qiniu.rs.PutPolicy({ scope: this.bucket })
      const token = policy.uploadToken(mac)
      const uploader = new qiniu.form_up.FormUploader()

      uploader.putFile(token, key, file.path, null, (err, res, info) => {
        if (err) return reject(err)
        if (info.statusCode !== 200) return reject(new Error(res.error))
        resolve(res)
      })
    })

    targetDir = targetDir || compile(this.dirFormat)(context)

    file.name = compile(this.nameFormat)(context)

    return this.getUniqueFileName(file, targetDir)
      // replace(/\\/g, '/') because https://github.com/TryGhost/Ghost-Storage-Base/blob/master/BaseStorage.js#L43 use path.join
      // when windows
      .then(filename => upload(filename.replace(/\\/g, '/'), file.path))
      .then(res => url.resolve(this.domain, res.key))
  }

  /**
   * Read file from storage
   * @param {Object} file An file object with properties path
   * @example
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/web/shared/middlewares/serve-favicon.js#L53
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/lib/image/image-size.js#L188
   * @todo
   * - url or path?
   */
  read (file) {
    const pathname = url.parse(file.path).pathname
    if (!pathname) return Promise.reject(new Error(`Could not read file: ${file.path}`))
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 Safari/537.36' }, encoding: null }
    return got.get(url.resolve(this.domain, pathname), options).then(res => res.body)
  }

  /**
   * Check whether a file exists or not
   * @param {string} filename the name of the file which is being uploaded
   * @param {string} targetDir the target dir of the file name [optional]
   * @example
   * - https://github.com/TryGhost/Ghost-Storage-Base/blob/master/BaseStorage.js#L38
   */
  exists (filename, targetDir) {
    targetDir = targetDir || ''
    filename = path.posix.join(targetDir, filename)
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 Safari/537.36' } }
    return got.head(url.resolve(this.domain, filename), options).then(() => true).catch(() => false)
  }

  /**
   * Delete file from storage
   * @example
   * - No use!!!
   */
  delete (filename) {
    return Promise.reject(new Error('Not implemented'))
  }

  /**
   * Serve middleware
   * @return {Function} Express middleware
   * @example
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/web/site/app.js#L61
   */
  serve () {
    return (req, res, next) => next()
  }
}

module.exports = QiniuStorage

// getUniqueFileName
// https://github.com/TryGhost/Ghost/blob/master/core/server/data/importer/handlers/image.js#L39
