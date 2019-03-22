const bytes = require('pretty-bytes')
const createReadStream = require('to-readable-stream')

module.exports = async assets => {
  const head = ['Image URL', 'Dimensions', 'Size', 'Extension']

  const body = assets.map(({ url, width, height, size, type }) => [
    url,
    `${width}x${height}`,
    bytes(size),
    type
  ])

  const csv = [head, ...body].reduce((table, row) => {
    return table.concat(row.join(',').concat('\n'))
  }, '')

  return createReadStream(csv)
}
