#!/usr/bin/env node
const path = require('path')
const { run } = require('./src/runner')
const defaultConfig = require('./src/default-config')
const version = require('./package').version
const { printHeader, printFooter, printLine, cutStack } = require('./src/util')

printHeader(version)

if (process.argv.length === 3 ) {
    const configFile = process.argv[2]
    const configPath = path.resolve(configFile)
    const testConfig = require(configPath)
    const config = Object.assign({}, defaultConfig, testConfig)
    console.log('Running config:', configPath)
    printLine('-')
    run(config).then(
        status => {
            printFooter(status)
            process.exit(status)
        }, 
        error => {
            console.log(`\x1b[31m${cutStack(error)}\x1b[0m`)
            printFooter(1)
            process.exit(1)
        }
    )
} else {
    console.log('Usage:')
    console.log('  staf <config-file.js>')
}

