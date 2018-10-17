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
  format: 'test/' + timestamp + '/${yyyy}/${mm}/${name}${ext}'
}

test.before(t => {
  const storage = new QiniuStorage(config)
  const file = {
    name: 'faker.txt',
    path: path.join(__dirname, 'z.txt')
  }
  return storage.save(file)
    .then(uri => {
      t.context.faker = uri
    })
})

test('constructor', t => {
  const storage = new QiniuStorage(config)
  t.truthy(storage.token)
  t.truthy(storage.uploader)
  t.truthy(storage.manager)

  t.is(storage.dirFormat, 'test/' + timestamp + '/${yyyy}/${mm}')
  t.is(storage.nameFormat, '${name}${ext}')
  t.is(storage.bucket, process.env.QINIU_BUCKET)
  t.is(storage.domain, process.env.QINIU_DOMAIN)
})

test('getDirectory', t => {
  const storage = new QiniuStorage(config)
  const dir = storage.getDirectory()
  t.is(dir, expectedDir)
})

test('getFilename', t => {
  const storage = new QiniuStorage(config)
  const filename = storage.getFilename('test.txt')
  t.is(filename, 'test.txt')
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
    .then(buffer => t.is(buffer, 'zce'))
})

test('read#case2', t => {
  const storage = new QiniuStorage(config)
  const pathname = url.parse(t.context.faker).pathname
  return storage.read({ path: pathname })
    .then(buffer => t.is(buffer, 'zce'))
})

test('read#case3', t => {
  const storage = new QiniuStorage(config)
  const pathname = url.parse(t.context.faker).pathname
  return storage.read({ path: pathname.slice(1) })
    .then(buffer => t.is(buffer, 'zce'))
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
