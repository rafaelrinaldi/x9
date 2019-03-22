const createReadStream = require('to-readable-stream')

module.exports = async (assets, title, url) => {
  const data = assets.map(({ width, height, ...rest }) => ({
    dimensions: { width, height },
    ...rest
  }))

  const json = JSON.stringify(
    {
      title,
      url,
      data
    },
    null,
    2
  )

  return createReadStream(json)
}
