'use strict'

const exporter = require('ipfs-unixfs-exporter')
const pull = require('pull-stream')
const deferred = require('pull-defer')
const { normalizePath } = require('./utils')

module.exports = function (self) {
  return function catPullStream (ipfsPath, options) {
    if (typeof ipfsPath === 'function') {
      throw new Error('You must supply an ipfsPath')
    }

    options = options || {}

    ipfsPath = normalizePath(ipfsPath)
    const pathComponents = ipfsPath.split('/')
    const fileNameOrHash = pathComponents[pathComponents.length - 1]

    if (options.preload !== false) {
      self._preload(pathComponents[0])
    }

    const d = deferred.source()
    //:console.log("pull "+exporter(ipfsPath, self._ipld, options))
    pull(
      exporter(ipfsPath, self._ipld, options),
      pull.filter(file => file.path === fileNameOrHash),
      pull.take(1),
      pull.collect((err, files) => {
        if (err) {
          return d.abort(err)
        }

        if (!files.length) {
          return d.abort(new Error('No such file'))
        }

        const file = files[0]
	/*files.forEach(function(element) {
  		console.log("Files:"+element.path);
	});
	console.log("File "+file.path)*/
        if (!file.content && file.type === 'dir') {
          return d.abort(new Error('this dag node is a directory'))
        }

        if (!file.content) {
          return d.abort(new Error('this dag node has no content'))
        }

        d.resolve(file.content)
      })
    )

    return d
  }
}
