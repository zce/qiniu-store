# qiniu-store

[![Build Status][travis-image]][travis-url]
[![Coverage Status][codecov-image]][codecov-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![NPM Version][version-image]][version-url]
[![License][license-image]][license-url]
[![Dependency Status][dependency-image]][dependency-url]
[![devDependency Status][devdependency-image]][devdependency-url]
[![Code Style][style-image]][style-url]

> Qiniu Storage for Ghost

## Installation

### Via Yarn or NPM

- Install qiniu-store module

  ```shell
  $ yarn add qiniu-store
  # or npm
  $ npm install qiniu-store
  ```

- Make the storage folder if it doesn't exist yet

  ```shell
  $ mkdir -p content/adapters/storage
  ```

- Copy the module into the right location

  ```shell
  $ cp -vR node_modules/qiniu-store content/adapters/storage/qiniu
  ```

### Via Git

In order to replace the storage module, the basic requirements are:

- Create a new folder inside `content/adapters` called `storage`

  ```shell
  $ mkdir -p content/adapters/storage
  ```

- Clone this repo to `storage`

  ```shell
  $ cd [path/to/ghost]/content/adapters/storage
  $ git clone https://github.com/zce/qiniu-store.git qiniu --depth 1
  ```

- Install dependencies

  ```shell
  $ cd qiniu
  $ yarn # or npm install
  ```

## Usage

### Ghost Adapter

In your `config.[env].json` file, you'll need to add a new `storage` block to whichever environment you want to change:

```json
{
  "storage": {
    "active": "qiniu",
    "qiniu": {
      "accessKey": "your access key",
      "secretKey": "your secret key",
      "bucket": "your bucket name",
      "domain": "your bucket domain",
      "format": "${yyyy}/${mm}/${name}${ext}"
    }
  }
}
```

#### Available format tags

- `${yyyy}`: year
- `${mm}`: month
- `${dd}`: dates
- `${uuid}`: uuid
- `${timestamp}`: timestamp
- `${random}`: 8 digit random
- `${name}`: original file name
- `${ext}`: original file ext

##### Example format

`"${yyyy}/${mm}/${dd}/${name}-${uuid}-${timestamp}-${random}${ext}"`

### Programatically

```javascript
const QiniuStore = require('qiniu-store')
const store = QiniuStore({
  accessKey: 'your access key',
  secretKey: 'your secret key',
  bucket: 'your bucket name',
  domain: 'your bucket domain',
  format: '${yyyy}/${mm}/${name}${ext}'
})

// save file
const file = { name: 'wow.png', path: '/Users/zce/Pictures/mono.png' }
store.save(file, '2018/10')

// read file
store.read({ path: '2018/10/wow.png' })

// exists file
store.exists('wow.png', '2018/10')
```

## API

### QiniuStore(options)

QiniuStore constructor

#### options

##### accessKey

- Type: `string`
- Details: qiniu access key.

##### secretKey

- Type: `string`
- Details: qiniu secret key.

##### bucket

- Type: `string`
- Details: qiniu bucket name.

##### domain

- Type: `string`
- Details: qiniu bucket domain.

### QiniuStore.prototype.save(file[, targetDir])

Save file to Qiniu storage, Returns a Promise for file url String.

#### file

##### name

- Type: `string`
- Details: the name of the file to upload.

##### path

- Type: `string`
- Details: the path of the file to upload.

#### targetDir

- Type: `string`
- Details: specific upload path.

### QiniuStore.prototype.read(file)

Read file from Qiniu storage, Returns a Promise for file buffer Buffer.

#### file

##### path

- Type: `string`
- Details: the path of the file.

### QiniuStore.prototype.exists(filename[, targetDir])

Returns a Promise for file exists.

#### filename

- Type: `string`
- Details: the name of the file.

#### targetDir

- Type: `string`
- Details: specific file direcory path.

### :construction: QiniuStore.prototype.delete(filename[, targetDir])

#### filename

- Type: `string`
- Details: the name of the file.

#### targetDir

- Type: `string`
- Details: specific file direcory path.

## Contributing

1. **Fork** it on GitHub!
2. **Clone** the fork to your own machine.
3. **Checkout** your feature branch: `git checkout -b my-awesome-feature`
4. **Commit** your changes to your own branch: `git commit -am 'Add some feature'`
5. **Push** your work back up to your fork: `git push -u origin my-awesome-feature`
6. Submit a **Pull Request** so that we can review your changes.

> **NOTE**: Be sure to merge the latest from "upstream" before making a pull request!

## License

[MIT](LICENSE) &copy; zce <w@zce.me> (https://zce.me/)



[travis-image]: https://img.shields.io/travis/zce/qiniu-store.svg
[travis-url]: https://travis-ci.org/zce/qiniu-store
[codecov-image]: https://img.shields.io/codecov/c/github/zce/qiniu-store.svg
[codecov-url]: https://codecov.io/gh/zce/qiniu-store
[downloads-image]: https://img.shields.io/npm/dm/qiniu-store.svg
[downloads-url]: https://npmjs.org/package/qiniu-store
[version-image]: https://img.shields.io/npm/v/qiniu-store.svg
[version-url]: https://npmjs.org/package/qiniu-store
[license-image]: https://img.shields.io/npm/l/qiniu-store.svg
[license-url]: https://github.com/zce/qiniu-store/blob/master/LICENSE
[dependency-image]: https://img.shields.io/david/zce/qiniu-store.svg
[dependency-url]: https://david-dm.org/zce/qiniu-store
[devdependency-image]: https://img.shields.io/david/dev/zce/qiniu-store.svg
[devdependency-url]: https://david-dm.org/zce/qiniu-store?type=dev
[style-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[style-url]: http://standardjs.com
