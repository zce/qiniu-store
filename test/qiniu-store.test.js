/* eslint-disable no-template-curly-in-string */
import test from 'ava'
import QiniuStorage from '..'

import url from 'url'
import path from 'path'
import moment from 'moment'

if (!process.env.CI) {
  require('dotenv').config()
}

const timestamp = Date.now()

const expectedDir = `test/${timestamp}/${moment().format('YYYY/MM')}`

const config = {
  accessKey: process.env.QINIU_AK,
  secretKey: process.env.QINIU_SK,
  bucket: process.env.QINIU_BUCKET,
  domain: process.env.QINIU_DOMAIN,
  format: 'test/' + timestamp + '/${year}/${month}/${name}${ext}'
}

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout))

test.before(t => {
  const storage = new QiniuStorage(config)
  const file = {
    name: 'faker.txt',
    path: path.join(__dirname, 'z.txt')
  }
  return storage.save(file)
    .then(uri => {
      t.context.faker = uri
      return delay(1 * 60 * 1000)
    })
})

test('constructor#case1', t => {
  const storage = new QiniuStorage(config)
  t.is(storage.accessKey, process.env.QINIU_AK)
  t.is(storage.secretKey, process.env.QINIU_SK)
  t.is(storage.bucket, process.env.QINIU_BUCKET)
  t.is(storage.domain, process.env.QINIU_DOMAIN)
  t.is(storage.dirFormat, 'test/' + timestamp + '/${year}/${month}')
  t.is(storage.nameFormat, '${name}${ext}')
})

test('constructor#case2', t => {
  const err = t.throws(() => new QiniuStorage({}))
  t.is(err.message, 'Missing necessary configuration options')
})

test('constructor#case3', t => {
  const config2 = Object.assign({}, config, { format: '${zce}' })
  const err = t.throws(() => new QiniuStorage(config2))
  t.is(err.message, 'Invalid format: ${zce} is unknown variable')
})

test('save#case1', t => {
  const storage = new QiniuStorage(config)
  const file = {
    name: 'test.txt',
    path: __filename
  }
  return storage.save(file)
    .then(uri => {
      t.is(uri, `${process.env.QINIU_DOMAIN}/${expectedDir}/test.txt`)
    })
})

test('save#case2', t => {
  const storage = new QiniuStorage(config)
  const file = {
    name: 'test.txt',
    path: __filename
  }
  return storage.save(file, `test/${timestamp}`)
    .then(uri => {
      t.is(uri, `${process.env.QINIU_DOMAIN}/test/${timestamp}/test.txt`)
    })
})

test('read#case1', t => {
  const storage = new QiniuStorage(config)
  return storage.read({ path: t.context.faker })
    .then(buffer => t.is(buffer.toString('utf8'), 'zce'))
})

test('read#case2', t => {
  const storage = new QiniuStorage(config)
  const pathname = url.parse(t.context.faker).pathname
  return storage.read({ path: pathname })
    .then(buffer => t.is(buffer.toString('utf8'), 'zce'))
})

test('read#case3', t => {
  const storage = new QiniuStorage(config)
  const pathname = url.parse(t.context.faker).pathname
  return storage.read({ path: pathname.slice(1) })
    .then(buffer => t.is(buffer.toString('utf8'), 'zce'))
})

test('exists#case1', t => {
  const storage = new QiniuStorage(config)
  return storage.exists('faker.txt')
    .then(exists => t.false(exists))
})

test('exists#case2', t => {
  const storage = new QiniuStorage(config)
  return storage.exists('faker.txt', expectedDir)
    .then(exists => t.true(exists))
})

test('delete', t => {
  const storage = new QiniuStorage(config)
  return storage.delete('faker.txt')
    .catch(err => t.is(err.message, 'Not implemented'))
})

test('serve', t => {
  const storage = new QiniuStorage(config)
  const middleware = storage.serve()
  t.truthy(middleware)
})

test('getUniqueFileName#case1', t => {
  const storage = new QiniuStorage(config)
  return storage.getUniqueFileName({ name: 'test.txt' }, '')
    .then(name => t.is(name, 'test-1.txt'))
})

test('getUniqueFileName#case2', t => {
  const storage = new QiniuStorage(config)
  return storage.getUniqueFileName({ name: 'cover.jpg' }, '2018/10')
    .then(name => t.is(name, '2018/10/cover-1.jpg'))
})
