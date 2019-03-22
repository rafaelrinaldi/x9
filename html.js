const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const bytes = require('pretty-bytes')
const createReadStream = require('to-readable-stream')

const IMAGE_BIG = 350000
const IMAGE_SUPER_BIG = 1000000

const getStatusByFileSize = size => {
  if (size >= IMAGE_BIG && size < IMAGE_SUPER_BIG) {
    return 'warning'
  } else if (size >= IMAGE_SUPER_BIG) {
    return 'danger'
  }

  return ''
}

module.exports = async (assets, title, url) => {
  const totalRequests = assets.length
  const totalSize = bytes(
    assets.reduce((accumulator, current) => accumulator + current.size, 0)
  )

  const preload = assets
    .map(({ url }) => `<link rel="preload" href="${url}">`)
    .join('')

  const head = ['URL', 'Dimensions', 'Size', 'Extension']
    .map(th => `<th>${th}</th>`)
    .join('')

  const body = assets
    .map(({ height, size, type, url, width }) => {
      const className = getStatusByFileSize(size)

      return `
        <tr class="${className}">
          <td>
            <a href="${url}" target="_blank">${url}</a>
          </td>
          <td>${width}x${height}</td>
          <td>${bytes(size)}</td>
          <td>${type}</td>
        </tr>
      `
    })
    .join('')

  const html = `
    <table data-table>
      <thead>
        <tr>${head}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `

  const template = await readFile('./table.html')
  const table = template
    .toString()
    .replace(/\{\{preload\}\}/gm, preload)
    .replace(/\{\{title\}\}/gm, title)
    .replace(/\{\{url\}\}/gm, url)
    .replace(/\{\{totalRequests\}\}/gm, totalRequests)
    .replace(/\{\{totalSize\}\}/gm, totalSize)
    .replace(/\{\{html\}\}/gm, html)

  return createReadStream(table)
}
