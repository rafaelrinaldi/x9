#!/usr/bin/env node

const main = require('./')
const minimist = require('minimist')
const options = {
  boolean: ['help', 'version', 'csv', 'html', 'json'],
  alias: {
    h: 'help',
    v: 'version'
  },
  default: {
    json: true
  }
}

const argv = minimist(process.argv.slice(2), options)
const [url] = argv._

const help = `
Usage: x9 [OPTIONS]

  List all image requests from a website, ordered by their file size

Options:
  -v --version              Display current software version
  -h --help                 Display help and usage details
     --json                 Compiles report to JSON (default)
     --html                 Compiles report to HTML
     --csv                  Compiles report to CSV
`

function exitWithSuccess (message) {
  process.stdout.write(`${message}\n`)
  process.exit(0)
}

function exitWithError (message, code = 1) {
  process.stderr.write(`${message}\n`)
  process.exit(code)
}

if (argv.help) exitWithSuccess(help)
if (argv.version) exitWithSuccess(require('./package.json').version)

async function run () {
  try {
    const output = await main({ ...argv, url })
    output.pipe(process.stdout)
  } catch (error) {
    exitWithError(error.message)
  }
}

run()
