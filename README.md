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

```shell
$ yarn add qiniu-store

# or npm
$ npm install qiniu-store
```

## Usage

<!-- TODO: Introduction of API use -->

```javascript
const qiniuStore = require('qiniu-store')
const result = qiniuStore('zce')
// result => 'zce@zce.me'
```

## API

<!-- TODO: Introduction of API -->

### qiniuStore(name[, options])

#### name

- Type: `string`
- Details: name string

#### options

##### host

- Type: `string`
- Details: host string
- Default: `'zce.me'`

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
