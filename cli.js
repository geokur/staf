#!/usr/bin/env node
const path = require('path')
const { run } = require('./src/runner')
const defaultConfig = require('./src/default-config')

console.log('==========================================')
console.log('|  Simple Test Automation Framework 1.0  |')
console.log('==========================================')

if (process.argv.length === 3 ) {
    const configFile = process.argv[2]
    const configPath = path.resolve(configFile)
    const testConfig = require(configPath)
    const config = Object.assign({}, defaultConfig, testConfig)
    console.log('Running config:')
    console.log('  %s', configPath)
    console.log('------------------------------------------')
    run(config).then(status => process.exit(status))
} else {
    console.log('Usage:')
    console.log('  simple <config-file.js>')
}