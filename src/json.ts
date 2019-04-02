import { Readable } from 'stream'
import createReadStream from 'to-readable-stream'
import { Asset } from './'

export default async function json (
  assets: Asset[],
  title: string,
  url: string
): Promise<Readable> {
  const json: string = JSON.stringify(
    {
      title,
      url,
      data: assets
    },
    null,
    2
  )
  return createReadStream(json)
}
