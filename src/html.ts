import * as fs from 'fs'
import { Readable } from 'stream'
import { promisify } from 'util'
import * as bytes from 'pretty-bytes'
import createReadStream from 'to-readable-stream'
import { Asset } from './'

const readFile: Function = promisify(fs.readFile)
const IMAGE_BIG: number = 350000
const IMAGE_SUPER_BIG: number = 1000000

type Status = 'warning' | 'danger' | ''

function getStatusByFileSize (size: number): Status {
  if (size >= IMAGE_BIG && size < IMAGE_SUPER_BIG) {
    return 'warning'
  } else if (size >= IMAGE_SUPER_BIG) {
    return 'danger'
  }

  return ''
}

export default async function html (
  assets: Asset[],
  title: string,
  url: string
): Promise<Readable> {
  const totalRequests: number = assets.length
  const totalSize: number = bytes(
    assets.reduce((accumulator, current) => accumulator + current.size, 0)
  )

  const preload: string = assets
    .map(({ url: string }) => `<link rel="preload" href="${url}">`)
    .join('')

  const head: string = ['URL', 'Dimensions', 'Size', 'Extension']
    .map((th: string) => `<th>${th}</th>`)
    .join('')

  const body: string = assets
    .map((asset: Asset) => {
      const {
        type,
        size,
        url,
        description,
        dimensions: { width, height }
      } = asset
      const className = getStatusByFileSize(size)

      return `
        <tr class="${className}">
          <td>
            <a href="${url}" target="_blank">${title}</a>
          </td>
          <td>${width}x${height}</td>
          <td>${bytes(size)}</td>
          <td>${type}</td>
        </tr>
      `
    })
    .join('')

  const html: string = `
    <table data-table>
      <thead>
        <tr>${head}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `

  const template: string = await readFile('./table.html')
  const table: string = template
    .toString()
    .replace(/\{\{preload\}\}/gm, preload)
    .replace(/\{\{title\}\}/gm, title)
    .replace(/\{\{url\}\}/gm, url)
    .replace(/\{\{totalRequests\}\}/gm, totalRequests.toString())
    .replace(/\{\{totalSize\}\}/gm, totalSize.toString())
    .replace(/\{\{html\}\}/gm, html)

  return createReadStream(table)
}
