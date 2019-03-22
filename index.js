const { URL } = require('url')
const puppeteer = require('puppeteer')
const sizeOf = require('buffer-image-size')
const json = require('./json')
const csv = require('./csv')
const html = require('./html')

let assets = []

async function getImageDescription (src, page) {
  try {
    const description = await page.$eval(
      `img[src="${src}"]`,
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

async function handleResponse (response, page) {
  const request = response.request()
  const isImage = request.resourceType() === 'image'

  // Bypass base64 encoded assets
  const isBase64 = request.url().startsWith('data:')
  const shouldProcessImage = isImage && !isBase64

  if (!shouldProcessImage) return

  const buffer = await response.buffer()
  const size = buffer.length
  const dimensions = size && sizeOf(buffer)
  const hasDimensions =
    dimensions && dimensions.width > 0 && dimensions.height > 0

  if (!hasDimensions) return

  const src = await response.url()
  const description = await getImageDescription(src, page)

  assets.push({
    ...dimensions,
    size,
    url: src,
    description
  })
}

async function main ({ url, ...options }) {
  new URL(url)

  assets.length = 0

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  page.on('response', response => handleResponse(response, page))

  await page.goto(url, { waitUntil: 'networkidle2' })

  const title = await page.title()

  // Sort by file size
  assets.sort((previous, next) => {
    return next.size - previous.size
  })

  await browser.close()

  return html(assets, title, url)
  // return json(assets, title, url)
  // return csv(assets, url)
}

module.exports = main
