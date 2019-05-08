/* eslint-disable no-template-curly-in-string */
import test from 'ava'
import QiniuStorage from '..'

import qiniu from 'qiniu'
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

const temps = []

test('constructor#case1', async t => {
  const storage = new QiniuStorage(config)
  t.is(storage.accessKey, process.env.QINIU_AK)
  t.is(storage.secretKey, process.env.QINIU_SK)
  t.is(storage.bucket, process.env.QINIU_BUCKET)
  t.is(storage.domain, process.env.QINIU_DOMAIN)
  t.is(storage.dirFormat, 'test/' + timestamp + '/${year}/${month}')
  t.is(storage.nameFormat, '${name}${ext}')
})

test('constructor#case2', async t => {
  const err = t.throws(() => new QiniuStorage({}))
  t.is(err.message, 'Missing necessary configuration options')
})

test('constructor#case3', async t => {
  const config2 = Object.assign({}, config, { format: '${zce}' })
  const err = t.throws(() => new QiniuStorage(config2))
  t.is(err.message, 'Invalid format: ${zce} is unknown variable')
})

test('save#case1', async t => {
  const storage = new QiniuStorage(config)
  const file = {
    name: 'test.txt',
    path: __filename
  }
  const uri = await storage.save(file)
  t.is(uri, `${process.env.QINIU_DOMAIN}/${expectedDir}/test.txt`)
  temps.push(`/${expectedDir}/test.txt`)
})

test('save#case2', async t => {
  const storage = new QiniuStorage(config)
  const file = {
    name: 'test.txt',
    path: __filename
  }
  const uri = await storage.save(file, `test/${timestamp}`)
  t.is(uri, `${process.env.QINIU_DOMAIN}/test/${timestamp}/test.txt`)
  temps.push(`/test/${timestamp}/test.txt`)
})

test('read#case1', async t => {
  const storage = new QiniuStorage(config)
  const buffer = await storage.read({ path: `${process.env.QINIU_DOMAIN}/test/qiniu-store.txt` })
  t.is(buffer.toString('utf8').trim(), 'zce')
})

test('read#case2', async t => {
  const storage = new QiniuStorage(config)
  const buffer = await storage.read({ path: 'test/qiniu-store.txt' })
  t.is(buffer.toString('utf8').trim(), 'zce')
})

test('read#case3', async t => {
  const storage = new QiniuStorage(config)
  const buffer = await storage.read({ path: 'test/qiniu-store.txt' })
  t.is(buffer.toString('utf8'), 'zce')
})

test('read#case4', async t => {
  const storage = new QiniuStorage(config)
  await t.throwsAsync(() => storage.read({ path: '' }), 'Could not read file: ')
})

test('exists#case1', async t => {
  const storage = new QiniuStorage(config)
  const exists = await storage.exists(`faker-${Math.random()}.txt`)
  t.false(exists)
})

test('exists#case2', async t => {
  const storage = new QiniuStorage(config)
  const exists = await storage.exists('qiniu-store.txt', '/test')
  t.true(exists)
})

test('delete', async t => {
  const storage = new QiniuStorage(config)
  await t.throwsAsync(() => storage.delete('faker.txt'), 'Not implemented')
})

test('serve', async t => {
  const storage = new QiniuStorage(config)
  t.is(typeof storage.serve(), 'function')
})

test('getUniqueFileName#case1', async t => {
  const storage = new QiniuStorage(config)
  const temp = `faker-${Math.random()}.txt`
  const name = await storage.getUniqueFileName({ name: temp }, '')
  t.is(name, temp)
})

test('getUniqueFileName#case2', async t => {
  const storage = new QiniuStorage(config)
  const name = await storage.getUniqueFileName({ name: 'qiniu-store.txt' }, 'test')
  t.is(name.replace(/\\/g, '/'), 'test/qiniu-store-1.txt')
})

test.after(async t => {
  const mac = new qiniu.auth.digest.Mac(process.env.QINIU_AK, process.env.QINIU_SK)
  const config = new qiniu.conf.Config()
  // config.useHttpsDomain = true;
  // config.zone = qiniu.zone.Zone_z0
  const bucketManager = new qiniu.rs.BucketManager(mac, config)
  const deleteOperations = temps.map(i => qiniu.rs.deleteOp(process.env.QINIU_BUCKET, i))
  bucketManager.batch(deleteOperations, () => t.end())
})
