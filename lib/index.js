const url = require('url')
const path = require('path')

const got = require('got')
const uuid = require('uuid')
const qiniu = require('qiniu')
const moment = require('moment')
const StorageBase = require('ghost-storage-base')

/**
 * Compile an ES6 template literals to a Template function
 * @param {String} source ES6 template literals
 */
const compile = source => context => new Function(`{ ${Object.keys(context).join(', ')} }`, `return \`${source}\``)(context)

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

    const { bucket, accessKey, secretKey, domain, format = '${yyyy}/${mm}/${name}${ext}' } = options

    if (!(bucket && accessKey && secretKey && domain && format)) {
      throw new Error('Missing necessary configuration options')
    }

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    const policy = new qiniu.rs.PutPolicy({ scope: bucket })

    this.token = policy.uploadToken(mac)
    this.uploader = new qiniu.form_up.FormUploader()
    this.manager = new qiniu.rs.BucketManager(mac)

    this.dirFormat = path.dirname(format).toLowerCase()
    this.nameFormat = path.basename(format).toLowerCase()

    this.bucket = bucket
    this.domain = domain
  }

  /**
   * Get path format context
   * @private
   */
  getPathContext () {
    const date = moment()
    return {
      yyyy: date.format('YYYY'),
      mm: date.format('MM'),
      dd: date.format('DD'),
      hh: date.format('HH'),
      timestamp: date.format('x'),
      random: Math.random().toString().substr(-8),
      uuid: uuid()
    }
  }

  /**
   * Get saved directory
   * @private
   */
  getDirectory () {
    const context = this.getPathContext()
    return compile(this.dirFormat)(context)
  }

  /**
   * Get saved file name
   * @param {String} original Original filename
   * @private
   */
  getFilename (original) {
    const context = this.getPathContext()
    context.ext = path.extname(original)
    context.name = path.basename(original, context.ext)
    return compile(this.nameFormat)(context)
  }

  /**
   * Save file to storage
   * @param {Object} file An file object with properties name and path
   * @param {String} targetDir A path to where to store the file [optional]
   * @example
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/api/v2/upload.js#L15
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/api/v2/upload.js#L25
   * - https://github.com/TryGhost/Ghost/blob/master/core/server/data/importer/importers/image.js#L70
   */
  save (file, targetDir) {
    targetDir = targetDir || this.getDirectory()

    file.name = this.getFilename(file.name)

    const upload = key => new Promise((resolve, reject) => {
      this.uploader.putFile(this.token, key, file.path, null, (err, res, info) => {
        if (err) return reject(err)
        if (info.statusCode !== 200) return reject(new Error(res.error))
        resolve(res)
      })
    })

    return this.getUniqueFileName(file, targetDir)
      .then(filename => upload(filename, file.path))
      .then(res => this.manager.publicDownloadUrl(this.domain, res.key))
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
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname
    const uri = this.manager.publicDownloadUrl(this.domain, key)
    return got.get(uri)
      .then(res => res.body)
  }

  /**
   * Check whether a file exists or not
   * @param {String} filename the name of the file which is being uploaded
   * @param {String} targetDir the target dir of the file name [optional]
   * @example
   * - https://github.com/TryGhost/Ghost-Storage-Base/blob/master/BaseStorage.js#L38
   */
  exists (filename, targetDir) {
    targetDir = targetDir || ''
    filename = path.posix.join(targetDir, filename)
    const key = filename.startsWith('/') ? filename.slice(1) : filename
    const uri = this.manager.publicDownloadUrl(this.domain, key)
    return got.head(uri).then(res => true).catch(err => false)
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
