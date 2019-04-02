import { Readable } from 'stream'
import bytes from 'pretty-bytes'
import createReadStream from 'to-readable-stream'
import { Asset } from './'

export default async function csv (assets: Asset[]): Promise<Readable> {
  const head = ['Image URL', 'Dimensions', 'Size', 'Extension']

  const body = assets.map(
    ({ url, dimensions: { width, height }, size, type }) => [
      url,
      `${width}x${height}`,
      bytes(size),
      type
    ]
  )

  const csv = [head, ...body].reduce((table, row) => {
    return table.concat(row.join(',').concat('\n'))
  }, '')

  return createReadStream(csv)
}
