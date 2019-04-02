import { Readable } from 'stream'
import { format } from 'util'
import { URL } from 'url'
import * as puppeteer from 'puppeteer'
import * as sizeOf from 'buffer-image-size'
// import json from './json'
// import csv from './csv'
import html from './html'

export interface Dimensions {
  width: number
  height: number
}

export type ResourceType =
  | 'document'
  | 'stylesheet'
  | 'image'
  | 'media'
  | 'font'
  | 'script'
  | 'texttrack'
  | 'xhr'
  | 'fetch'
  | 'eventsource'
  | 'websocket'
  | 'manifest'
  | 'other'

export interface Asset {
  dimensions?: Dimensions
  size: number
  url: string
  description: string
  type: ResourceType
}

export interface Request {
  resourceType: () => ResourceType
  url: () => string
}

export interface Page {
  $eval: (selector: string, callback: Function) => Promise<any>
  on: (event: string, callback: Function) => void
  goto: (url: string, options: { waitUntil: string }) => void
  title: () => Promise<string>
}

export interface Response {
  request: () => Request
  buffer: () => Promise<Buffer>
  url: () => Promise<string>
}

export interface Browser {
  newPage: () => Promise<Page>
  close: () => Promise<any>
}

export interface Options {
  url: string
  html?: boolean
  json?: boolean
  csv?: boolean
}

let assets: Asset[] = []

const IMAGE_SELECTOR = 'img[src="%s"]'

async function getImageDescription (src, page) {
  try {
    const description: Promise<string | null> = await page.$eval(
      format(IMAGE_SELECTOR, src),
      img =>
        img.getAttribute('alt') ||
        img.getAttribute('title') ||
        img.getAttribute('aria-label')
    )

    return description
  } catch (error) {
    return src.split('/').pop()
  }
}

async function handleResponse (response: Response, page: Page): Promise<void> {
  const request: Request = response.request()
  const type: ResourceType = request.resourceType()
  const isImage: boolean = type === 'image'

  // Bypass base64 encoded assets
  const isBase64: boolean = request.url().startsWith('data:')
  const shouldProcessImage: boolean = isImage && !isBase64

  if (!shouldProcessImage) return

  const buffer: Buffer = await response.buffer()
  const size: number = buffer.length
  const dimensions: Dimensions = size && sizeOf(buffer)
  const hasDimensions: boolean =
    dimensions && dimensions.width > 0 && dimensions.height > 0

  if (!hasDimensions) return

  const src: string = await response.url()
  const description: string = await getImageDescription(src, page)
  const { width, height } = dimensions
  const asset: Asset = {
    dimensions: { width, height },
    size,
    url: src,
    description,
    type
  }

  assets.push(asset)
}

async function main ({ url, ...options }: Options): Promise<Readable> {
  new URL(url)

  assets.length = 0

  const browser: Browser = await puppeteer.launch()
  const page: Page = await browser.newPage()

  page.on('response', response => handleResponse(response, page))

  await page.goto(url, { waitUntil: 'networkidle2' })

  const title: string = await page.title()

  // Sort by file size
  assets.sort((previous, next) => {
    return next.size - previous.size
  })

  await browser.close()

  return html(assets, title, url)
  // return json(assets, title, url)
  // return csv(assets, url)
}

export default main
